from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Union
from enum import Enum
from pydantic import BaseModel

class ModelType(str, Enum):
    # Specialized Models
    QWEN_MAX = "qwen-max"
    GLM_4 = "glm-4"
    PERPLEXITY = "perplexity"
    
    # Generic (OpenAI Compatible)
    GPT_4 = "gpt-4"
    GPT_3_5 = "gpt-3.5-turbo"
    DEEPSEEK_CHAT = "deepseek-chat"
    
class Message(BaseModel):
    role: str
    content: str
    
class LLMResponse(BaseModel):
    content: str
    raw_response: Any = None
    usage: Optional[Dict[str, int]] = None
    model_name: str

class BaseLLM(ABC):
    """
    Abstract Base Class for all LLM Providers
    Standardizes the interface for the Middle Platform
    """
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        self.api_key = api_key
        self.config = kwargs

    @abstractmethod
    def chat(self, messages: List[Dict[str, str]], **kwargs) -> LLMResponse:
        """
        Standard chat completion interface
        :param messages: List of message dicts [{'role': 'user', 'content': '...'}]
        :return: LLMResponse object
        """
        pass
    
    @abstractmethod
    def chat_stream(self, messages: List[Dict[str, str]], **kwargs):
        """Standard streaming interface"""
        pass
