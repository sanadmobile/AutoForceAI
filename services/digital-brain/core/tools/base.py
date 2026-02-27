from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseTool(ABC):
    name: str = "base_tool"
    description: str = "Base tool description"
    
    @abstractmethod
    def run(self, params: Dict[str, Any]) -> str:
        """Execute the tool"""
        pass
    
    @property
    def schema(self) -> Dict[str, Any]:
        """JSON Schema for function calling"""
        return {}
