from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from core.dependencies import get_db, get_current_user_id
from core.db_manager import get_tenant_session
from database.models import AnalysisTask, TaskStatus
from database.shared_models import User
from branding_monitor.engines.qwen_client import QwenClient
from branding_monitor.engines.zhipu_client import ZhipuClient
from branding_monitor.analyzer.mention_extractor import MentionExtractor

# Try to import other clients if available
try:
    from branding_monitor.engines.perplexity_client import MockPerplexityClient
except ImportError:
    MockPerplexityClient = None

router = APIRouter(prefix="/api/v1/branding", tags=["Branding Monitor"])

# --- Schemas ---

class AnalysisRequest(BaseModel):
    target_brand: str
    query: str
    engine_name: str = "zhipu" # Change default to Zhipu
    project_id: Optional[int] = None

class AnalysisTaskResponse(BaseModel):
    id: int
    target_brand: str
    query: str
    status: str
    engine_name: Optional[str]
    is_mentioned: Optional[bool]
    rank_position: Optional[int]
    sentiment_score: Optional[float]
    reasoning: Optional[str]
    suggestions: Optional[List[str]] = []
    citations: Optional[List[str]] = []
    progress: Optional[int] = 0
    current_step: Optional[str] = ""
    logs: Optional[List[dict]] = []
    raw_response: Optional[str] = ""
    created_at: datetime
    
    class Config:
        orm_mode = True

# --- Background Task Logic ---

def run_brand_analysis(task_id: int, target_brand: str, query: str, engine_name: str, user_id: int):
    """
    Executes the analysis in background using a fresh DB session (Tenant Specific)
    """
    # Use Tenant DB Session instead of Global SessionLocal
    db = get_tenant_session(user_id)
    print(f"[Task {task_id}] Starting analysis for '{target_brand}' on '{query}' using {engine_name} (User: {user_id})")
    
    def update_progress(msg: str, step: str, prog: int):
        try:
             # Re-fetch task to ensure we have latest state and valid session attachment
             t = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
             if t:
                 progress_log = {"timestamp": datetime.now().isoformat(), "message": msg, "type": "info"}
                 # Append to existing logs (ensure list is initialized)
                 current_logs = t.logs if t.logs else []
                 # Make a copy to trigger SQLAlchemy change detection for JSON type
                 new_logs = list(current_logs) 
                 new_logs.append(progress_log)
                 
                 t.logs = new_logs
                 t.current_step = step
                 t.progress = prog
                 db.commit()
        except Exception as ex:
            print(f"Error updating progress: {ex}")

    try:
        task = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
        if not task:
            return

        task.status = TaskStatus.RUNNING.value
        task.logs = [] # Initialize logs
        db.commit()
        
        update_progress(f"正在初始化任务: {target_brand}...", "初始化", 10)

        # 1. Fetch Content
        search_result = ""
        
        # Determine Engine
        lower_engine = engine_name.lower()
        if "qwen" in lower_engine: 
            print(f"[Task {task_id}] Using Qwen (DashScope)...")
            update_progress("正在连接通义千问 (Qwen-Max)...", "正在搜索", 25)
            # Use QwenClient
            client = QwenClient() 
            search_result = client.query(query, enable_search=True)
        elif "zhipu" in lower_engine or "glm" in lower_engine:
            print(f"[Task {task_id}] Using ZhipuAI (GLM-4)...")
            update_progress("正在连接智谱AI (GLM-4)...", "正在搜索", 25)
            client = ZhipuClient()
            search_result = client.query(query, enable_search=True)
        elif "perplexity" in lower_engine:
            client = MockPerplexityClient() if MockPerplexityClient else None
            if client:
                search_result = client.search(query)
            else:
                search_result = "Perplexity Client Not Available. Simulation Mode."
        else:
             # Default fallback
             print(f"[Task {task_id}] Auto Mode: Using Qwen (Default)...")
             client = QwenClient() # Default to Qwen for better stability/mock support
             search_result = client.query(query, enable_search=True)

        update_progress("搜索完成。已获取网页内容。", "正在分析", 50)

        # 2. Analyze Content
        update_progress("开始 AI 语义分析 (LLM 裁判)...", "正在分析", 60)
        
        # Wrapper to enforce enable_search=False for the Analyzer
        class NoSearchWrapper:
            def __init__(self, client):
                self.client = client
                
            def query(self, prompt, **kwargs):
                # Ignore any kwargs passed by caller, enforce our own
                update_progress("正在发送评估指令给 LLM...", "正在分析", 65)
                start_analyzing = datetime.now()
                
                # QwenClient signature might differ slightly or handle kwargs differently
                # But our QwenClient.query accepts enable_search
                res = self.client.query(prompt, enable_search=False)
                
                duration = (datetime.now() - start_analyzing).total_seconds()
                update_progress(f"LLM 响应耗时 {duration:.1f}秒。正在解析 JSON...", "正在分析", 85)
                return res

        # Use the SAME client class for analysis to match the selected engine
        # If Qwen was used for search, use Qwen for analysis to be consistent
        if "zhipu" in lower_engine or "glm" in lower_engine:
             analyzer_engine = ZhipuClient()
        else:
             analyzer_engine = QwenClient()  # Default to Qwen

        analyzer_client = NoSearchWrapper(analyzer_engine)
            
        analyzer = MentionExtractor(llm_client=analyzer_client)
        
        analysis = analyzer.analyze(target_brand, query, search_result)
        
        # [Crucial Fix] Inject the actual LLM Answer into the analysis result so frontend can display it
        analysis['snippet'] = search_result

        update_progress("分析完成。正在生成最终数据...", "完成", 90)
        
        # 3. Update DB
        # Re-fetch one last time to be safe
        task = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
        
        task.is_mentioned = analysis.get("is_mentioned", False)
        # Ensure rank_position is an integer, even if analysis returns None or invalid
        try:
             task.rank_position = int(analysis.get("rank_position", -1))
        except (ValueError, TypeError):
             task.rank_position = -1
             
        task.sentiment_score = analysis.get("sentiment_score", 0.0)
        task.reasoning = analysis.get("reasoning", "Analysis failed or returned empty.")
        task.suggestions = analysis.get("suggestions", [])
        task.citations = analysis.get("citations", []) 
        
        # Save full analysis including the 'snippet' (search_result) as valid JSON string
        import json
        task.raw_response = json.dumps(analysis, ensure_ascii=False)
        
        task.status = TaskStatus.COMPLETED.value
        task.progress = 100
        task.current_step = "已完成"
        
        db.add(task) # Explicit add for session tracking
        db.commit()
        db.refresh(task)
        print(f"[Task {task_id}] Completed successfully. Score: {task.sentiment_score}")
        
    except Exception as e:
        print(f"[Task {task_id}] Failed: {e}")
        # Need to rollback to ensure we can write the error state
        try:
            db.rollback()
            task = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
            if task:
                task.status = TaskStatus.FAILED.value
                task.reasoning = f"Error: {str(e)}"
                task.progress = 0
                db.commit()
        except:
             pass
    finally:
        db.close()

# --- Endpoints ---

@router.post("/analyze", response_model=AnalysisTaskResponse)
def create_analysis_task(
    request: AnalysisRequest, 
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new brand monitoring task"""
    new_task = AnalysisTask(
        target_brand=request.target_brand,
        query=request.query,
        engine_name=request.engine_name,
        project_id=request.project_id,
        status=TaskStatus.PENDING.value,
        created_at=datetime.now()
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Trigger Background Task - Pass User ID for correct DB access
    background_tasks.add_task(
        run_brand_analysis, 
        new_task.id, 
        new_task.target_brand, 
        new_task.query, 
        new_task.engine_name,
        user_id
    )
    
    # Return 200 explicitly with model to ensure frontend gets data
    return new_task

@router.get("/tasks", response_model=List[AnalysisTaskResponse])
def get_tasks(
    skip: int = 0, 
    limit: int = 20, 
    db: Session = Depends(get_db)
):
    """List recent tasks"""
    tasks = db.query(AnalysisTask).order_by(AnalysisTask.created_at.desc()).offset(skip).limit(limit).all()
    # Debug print
    # print(f"Found {len(tasks)} tasks")
    return tasks

@router.get("/tasks/{task_id}", response_model=AnalysisTaskResponse)
def get_task_detail(task_id: int, db: Session = Depends(get_db)):
    task = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
