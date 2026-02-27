from sqlalchemy.orm import Session
from datetime import datetime
from database.shared_models import LLMRequestLog
from core.db_manager import SharedSessionLocal

class CostMonitor:
    @staticmethod
    def log_request(
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: int,
        status: str = "success",
        error_msg: str = None,
        user_id: int = None,
        trace_id: str = None
    ):
        """
        Logs LLM usage to the shared database.
        Designed to be called as a BackgroundTask in FastAPI or directly in async workers.
        """
        db: Session = SharedSessionLocal()
        try:
            log_entry = LLMRequestLog(
                provider=provider,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
                latency_ms=latency_ms,
                status=status,
                error_msg=error_msg[:1000] if error_msg else None, # Truncate error msg
                user_id=user_id,
                trace_id=trace_id,
                created_at=datetime.now()
            )
            db.add(log_entry)
            db.commit()
            # print(f"[Monitor] Logged {model} call. Tokens: {input_tokens}+{output_tokens}")
        except Exception as e:
            print(f"[Monitor] Failed to log LLM request: {e}")
        finally:
            db.close()
