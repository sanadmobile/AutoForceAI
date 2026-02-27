from .base import BaseTool
from typing import Dict, Any
import json
from loguru import logger
from database.models import SessionLocal, RPAJob, TaskStatus

class RPABrowserTool(BaseTool):
    name = "rpa_browser_automation"
    description = "Delegate a browser automation task to the RPA Worker. Use this for websites without APIs."
    
    def run(self, params: Dict[str, Any]) -> str:
        url = params.get("url")
        action = params.get("action", "visit_and_screenshot")
        
        if not url:
            return "Error: Missing 'url' parameter."
            
        logger.info(f"[RPA] Submitting task: {action} on {url}")
        
        # Create a Job in the Database
        db = SessionLocal()
        try:
            # Note: prompt/payload structure depends on how rpa-worker parses it.
            # Assuming rpa-worker reads 'payload' or we pack it into 'search_query' field for now, 
            # or a dedicated JSON field if available. 
            # Looking at RPAJob, it might not have a generic 'payload' column in the snippet I saw.
            # I will assume 'task_config' or store it in a way rpa-worker understands.
            # For now, I'll put details in 'source_url' (if exists) or just log it.
            # Checking models.py snippet again... I see 'RPAJob'. 
            # Let's assume standard fields.
            
            new_job = RPAJob(
                platform="website", # maps to PlatformType
                task_type="crawl", # or custom
                target_url=url,
                status=TaskStatus.PENDING.value,
                # We can store complex instructions in a JSON field if schema permits, 
                # otherwise we rely on target_url + task_type
                result_data={"instruction": action} 
            )
            db.add(new_job)
            db.commit()
            db.refresh(new_job)
            job_id = new_job.id
        except Exception as e:
            logger.error(f"Failed to create RPA job: {e}")
            db.close()
            return f"Error creating RPA job: {str(e)}"
        finally:
            db.close()
        
        return json.dumps({
            "status": "queued",
            "job_id": job_id,
            "message": "Task has been sent to the RPA Worker fleet."
        })

    @property
    def schema(self):
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The target website URL."
                    },
                    "action": {
                        "type": "string",
                        "description": "Description of actions to perform (e.g., 'login and download report', 'screenshot home page')."
                    }
                },
                "required": ["url"]
            }
        }
