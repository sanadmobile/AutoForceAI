from typing import List, Dict, Any
import json
from datetime import datetime
from sqlalchemy.orm import Session
from loguru import logger

from database.shared_models import BrainSession, BrainMessage, QualityRule, InspectionRecord
from core.llm.factory import ModelFactory

class SessionInspector:
    def __init__(self, db: Session):
        self.db = db
        # Initialize LLM (Use a smart model for judging, e.g., GPT-4 or Qwen-Max)
        # For now we use the default system model factory
        self.llm = ModelFactory.get_provider(model_type="zhipu", model="glm-4-flash")  # Or use a dedicated "Judge" model
        
    def inspect(self, session_id: int) -> InspectionRecord:
        """
        Run AI Inspection for a given session.
        """
        logger.info(f"[Inspector] Starting inspection for Session {session_id}")
        
        # 1. Fetch Data
        session = self.db.query(BrainSession).filter(BrainSession.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
            
        messages = self.db.query(BrainMessage).filter(BrainMessage.session_id == session_id).order_by(BrainMessage.created_at).all()
        rules = self.db.query(QualityRule).filter(QualityRule.is_active == True).all()
        
        if not messages:
            logger.warning("Empty session, skipping.")
            return None

        # 2. Construct Prompt
        transcript = self._format_transcript(messages)
        rubric = self._format_rubric(rules)
        
        prompt = f"""
        你是一位专业的客服质检专家 (Quality Assurance Specialist)。请根据以下[对话记录]和[质检标准]，对客服的表现进行评分。
        
        ### 对话记录 (Transcript)
        {transcript}
        
        ### 质检标准 (SOP Rubric)
        {rubric}
        
        ### 任务要求
        1. 对每一项规则进行打分（满分=权重值）。
        2. 如果发现问题，必须引用原话作为证据。
        3. 计算总分（满分100，根据各项权重归一化计算）。
        4. 给出最终评级 (Excellent > 90, Good > 80, Warning > 60, Critical < 60)。
        5. 以 JSON 格式输出结果。
        
        ### 输出格式 (JSON Only)
        {{
            "total_score": 85.5,
            "status": "Good",
            "issues": [
                 {{ "rule": "礼貌与态度", "deduction": 2, "reason": "第3轮回复中语气略显生硬", "evidence": "你是听不懂吗" }}
            ],
            "suggestion": "整体表现尚可，但在处理用户反复追问时缺乏耐心，建议使用'我理解您的焦急'等共情话术。"
        }}
        """
        
        # 3. Call LLM
        logger.info("[Inspector] Sending to LLM...")
        try:
            # Use a slightly lower temperature for deterministic judging
            messages = [{"role": "user", "content": prompt}]
            response = self.llm.chat(messages, temperature=0.1)
            response_text = response.content
            
            response_text = self._clean_json(response_text)
            result = json.loads(response_text)
            
            # 4. Save Record
            record = InspectionRecord(
                session_id=session_id,
                total_score=result.get("total_score", 0),
                status=result.get("status", "Warning"),
                issues=result.get("issues", []),
                suggestion=result.get("suggestion", ""),
                model_used="glm-4-flash" # TODO: Get from factory
            )
            
            # Remove old record if exists
            old_record = self.db.query(InspectionRecord).filter(InspectionRecord.session_id == session_id).first()
            if old_record:
                self.db.delete(old_record)
                
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
            
            logger.info(f"[Inspector] Inspection Completed. Score: {record.total_score}")
            return record

        except Exception as e:
            logger.error(f"[Inspector] Failed: {e}")
            raise e

    def _format_transcript(self, messages: List[BrainMessage]) -> str:
        text = ""
        for i, msg in enumerate(messages):
            role_name = "用户" if msg.role == "user" else "客服AI"
            text += f"[{i+1}] {role_name}: {msg.content}\n"
        return text

    def _format_rubric(self, rules: List[QualityRule]) -> str:
        text = ""
        for rule in rules:
            text += f"- 【{rule.name}】 (权重: {rule.weight})\n  定义: {rule.description}\n"
        return text
    
    def _clean_json(self, text: str) -> str:
        # Simple cleaner for Markdown code blocks
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()
