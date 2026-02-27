from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta
import platform
try:
    import psutil
except ImportError:
    psutil = None

from core.dependencies import get_db
from core.db_manager import SharedSessionLocal, get_shared_db 
# Fix: RPAJob moved to shared_models
from database.shared_models import LLMRequestLog, RPAJobStatus, LLMModel, User, InspectionRecord, BrainSession, QualityRule
from database.models import RPAJob
from core.quality.inspector import SessionInspector
from fastapi import BackgroundTasks


router = APIRouter(prefix="/api/v1/monitor", tags=["Monitoring"])

def get_shared_db_local(): # Rename to avoid conflict if already imported
    """Dependency for Shared DB (Logs)"""
    db = SharedSessionLocal()
    try:
        yield db
    finally:
        db.close()

from pydantic import BaseModel

class QualityRuleBase(BaseModel):
    name: str
    description: str
    weight: float = 1.0
    is_active: bool = True

class QualityRuleCreate(QualityRuleBase):
    pass

class QualityRuleUpdate(QualityRuleBase):
    pass

# --- Quality Rule Configuration Endpoints ---

@router.get("/inspection/rules")
def get_quality_rules(db: Session = Depends(get_shared_db)):
    """获取所有质检规则"""
    rules = db.query(QualityRule).order_by(QualityRule.id).all()
    return rules

@router.post("/inspection/rules")
def create_quality_rule(rule: QualityRuleCreate, db: Session = Depends(get_shared_db)):
    """创建新的质检规则"""
    db_rule = QualityRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.put("/inspection/rules/{rule_id}")
def update_quality_rule(rule_id: int, rule: QualityRuleUpdate, db: Session = Depends(get_shared_db)):
    """更新质检规则"""
    db_rule = db.query(QualityRule).filter(QualityRule.id == rule_id).first()
    if not db_rule:
        return {"error": "Rule not found"}
    
    for key, value in rule.dict().items():
        setattr(db_rule, key, value)
    
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.delete("/inspection/rules/{rule_id}")
def delete_quality_rule(rule_id: int, db: Session = Depends(get_shared_db)):
    """删除质检规则"""
    db_rule = db.query(QualityRule).filter(QualityRule.id == rule_id).first()
    if not db_rule:
        return {"error": "Rule not found"}
    
    db.delete(db_rule)
    db.commit()
    return {"status": "success", "message": "Rule deleted"}

# --- Quality Inspection Endpoints ---

@router.get("/inspection/stats")
def get_inspection_stats(db: Session = Depends(get_shared_db)):
    """Get summarized quality metrics for dashboard"""
    # 1. KPI Cards
    total_records = db.query(InspectionRecord).count()
    if total_records == 0:
        return {"avg_score": 0, "issue_count": 0, "critical_count": 0}
        
    avg_score = db.query(func.avg(InspectionRecord.total_score)).scalar() or 0
    critical_count = db.query(InspectionRecord).filter(InspectionRecord.status == "Critical").count()
    
    # 2. Issues Breakdown (Need to parse JSON, simplify for now by counting records with issues)
    # Ideally should flatten the JSON array
    # For MVP, we return simple stats
    
    return {
        "avg_score": round(avg_score, 1),
        "total_inspections": total_records,
        "critical_sessions": critical_count,
        # "trend": ... (TODO: Add date aggregation)
    }

@router.post("/inspection/{session_id}")
def trigger_inspection(session_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_shared_db)):
    """Manually trigger an AI inspection for a session"""
    session = db.query(BrainSession).filter(BrainSession.id == session_id).first()
    if not session:
        return {"error": "Session not found"}
    
    inspector = SessionInspector(db)
    # Run in background to avoid blocking
    background_tasks.add_task(inspector.inspect, session_id)
    
    return {"status": "queued", "message": f"Inspection started for Session {session_id}"}


@router.get("/inspection/records")
def get_inspection_records(limit: int = 50, db: Session = Depends(get_shared_db)):
    """Get list of recent inspections with session details"""
    records = db.query(
            InspectionRecord, 
            User.nickname,
            BrainSession.title, 
            BrainSession.created_at.label("session_time")
        )\
        .join(BrainSession, InspectionRecord.session_id == BrainSession.id)\
        .outerjoin(User, BrainSession.user_id == User.id)\
        .order_by(InspectionRecord.created_at.desc())\
        .limit(limit)\
        .all()
    
    result = []
    for r, nickname, title, s_time in records:
        result.append({
            "id": r.id,
            "session_id": r.session_id,
            "user_id": r.session_id, # Keep for ID ref
            "user_nickname": nickname or f"User_{r.session_id}",
            "topic": title,
            "score": r.total_score,
            "status": r.status,
            "time": s_time,
            "issues": r.issues,
            "suggestion": r.suggestion,
            "issues_count": len(r.issues) if r.issues else 0
        })
    return result

@router.get("/system")
def get_system_status(db: Session = Depends(get_shared_db)):
    """Get System Health & Resource Usage"""
    
    # System Info
    cpu_percent = psutil.cpu_percent(interval=None) if hasattr(psutil, 'cpu_percent') else 0
    memory = psutil.virtual_memory() if hasattr(psutil, 'virtual_memory') else None
    
    # DB Counts
    active_models = db.query(LLMModel).filter(LLMModel.is_active == True).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    queued_jobs = db.query(RPAJob).filter(RPAJob.status == "queued").count()
    
    return {
        "status": "healthy",
        "cpu_usage": cpu_percent,
        "memory_usage": {
            "total": memory.total if memory else 0,
            "used": memory.used if memory else 0,
            "percent": memory.percent if memory else 0
        },
        "system_info": {
            "platform": platform.system(),
            "release": platform.release(),
            "python_version": platform.python_version()
        },
        "resources": {
            "active_models": active_models,
            "active_users": active_users,
            "queued_jobs": queued_jobs
        }
    }

@router.get("/rpa/stats")
def get_rpa_stats(db: Session = Depends(get_shared_db)): # Use shared_db for RPAJob now
    """Get RPA Job counts by status"""
    # Group by status
    stats = db.query(RPAJob.status, func.count(RPAJob.id)).group_by(RPAJob.status).all()
    result = {k: 0 for k in ["queued", "running", "completed", "failed"]} # Normalize keys if needed
    
    # Map ENUM to Frontend keys if they differ, otherwise just use as is
    for status, count in stats:
        result[str(status)] = count
        
    # Get recent failures
    failed_jobs = db.query(RPAJob).filter(RPAJob.status == "failed").order_by(RPAJob.created_at.desc()).limit(5).all()
    
    return {
        "counts": result,
        "recent_failures": [
            {"id": j.id, "platform": j.platform, "msg": str(j.payload), "time": j.created_at} 
            for j in failed_jobs
        ]
    }

@router.get("/llm/usage")
def get_llm_usage(days: int = 7, db: Session = Depends(get_shared_db)):
    """Get LLM Token usage aggregated by date"""
    since = datetime.now() - timedelta(days=days)
    
    logs = db.query(LLMRequestLog).filter(LLMRequestLog.created_at >= since).all()
    
    # Aggregation in python (Database agnostic)
    daily_stats = {}
    provider_stats = {}
    total_tokens = 0
    total_calls = 0
    
    for log in logs:
        # Date Aggregation
        date_str = log.created_at.strftime("%Y-%m-%d")
        if date_str not in daily_stats:
            daily_stats[date_str] = {"date": date_str, "tokens": 0, "calls": 0}
        daily_stats[date_str]["tokens"] += log.total_tokens
        daily_stats[date_str]["calls"] += 1
        
        # Provider Aggregation
        prov = log.provider or "unknown"
        if prov not in provider_stats:
            provider_stats[prov] = 0
        provider_stats[prov] += log.total_tokens
        
        total_tokens += log.total_tokens
        total_calls += 1
        
    return {
        "summary": {
            "total_tokens": total_tokens,
            "total_calls": total_calls,
        },
        "daily_trend": sorted(list(daily_stats.values()), key=lambda x: x['date']),
        "by_provider": provider_stats
    }

@router.get("/llm/logs")
def get_recent_logs(limit: int = 50, db: Session = Depends(get_shared_db)):
    return db.query(LLMRequestLog).order_by(LLMRequestLog.created_at.desc()).limit(limit).all()
