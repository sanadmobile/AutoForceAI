from .base import BaseTool
from typing import Dict, Any
import json
from loguru import logger
import os

class PPTGeneratorTool(BaseTool):
    name = "ppt_generator"
    description = "Generate a PowerPoint presentation based on a topic and outline."
    
    def run(self, params: Dict[str, Any]) -> str:
        topic = params.get("topic")
        pages = params.get("pages", [])
        
        if not topic:
            return "Error: Missing 'topic'."
            
        logger.info(f"[PPT] Generating Presentation for: {topic}")
        
        # In a real implementation, this would call core.ppt_design.PPTDesigner
        # from core.ppt_design import PPTDesigner
        # designer = PPTDesigner()
        # file_path = designer.create(topic, pages)
        
        # Mocking the file creation
        filename = f"{topic.replace(' ', '_')}_v1.pptx"
        output_path = os.path.join("storage", "temp_ppt", filename)
        
        return json.dumps({
            "status": "success",
            "file_path": output_path,
            "download_url": f"/api/files/ppt/{filename}",
            "message": f"PPT generated with {len(pages)} pages."
        })

    @property
    def schema(self):
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The main title/topic of the presentation."
                    },
                    "pages": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "content": {"type": "array", "items": {"type": "string"}}
                            }
                        },
                        "description": "List of slides with titles and bullet points."
                    }
                },
                "required": ["topic"]
            }
        }
