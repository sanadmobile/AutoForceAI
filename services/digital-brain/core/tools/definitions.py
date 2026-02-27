from .base import BaseTool
from typing import Dict, Any
import json
import random

class OrderStatusTool(BaseTool):
    name = "check_order_status"
    description = "Check the status and logistics of a customer order."
    
    def run(self, params: Dict[str, Any]) -> str:
        order_id = params.get("order_id")
        if not order_id:
            return "Error: Missing order_id parameter."
            
        # Mock Logic
        statuses = ["Shipped", "Processing", "Delivered", "Cancelled"]
        status = random.choice(statuses)
        return json.dumps({
            "order_id": order_id,
            "status": status,
            "estimated_delivery": "2026-02-10"
        })

    @property
    def schema(self):
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string", "description": "The order ID (e.g., ORD-123)"}
                },
                "required": ["order_id"]
            }
        }


