import os
import dashscope
from dashscope import Generation
from typing import List, Dict, Any
from ..base import BaseLLM, LLMResponse

class QwenLLM(BaseLLM):
    def __init__(self, api_key: str = None, **kwargs):
        super().__init__(api_key, **kwargs)
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            # logging warning here ideally
            pass
        dashscope.api_key = self.api_key
        self.default_model = kwargs.get("model", "qwen-max")

    def chat(self, messages: List[Dict[str, str]], **kwargs) -> LLMResponse:
        model = kwargs.get("model", self.default_model)
        enable_search = kwargs.get("enable_search", False)
        
        # Plugin setup
        plugins = {'search': {}} if enable_search else None
        
        try:
            # 1. Attempt call with plugins if requested
            response = Generation.call(
                model=model,
                messages=messages,
                result_format='message',
                plugins=plugins
            )

            # Check for plugin errors specifically
            if response.status_code != 200:
                is_plugin_error = "InvalidPlugin" in str(response.message) or "NotExist" in str(response.message)
                
                if enable_search and is_plugin_error:
                    # Fallback to standard generation without search
                    print(f"[Warn] Qwen Search Plugin failed ({response.message}), falling back to standard mode.")
                    response = Generation.call(
                        model=model,
                        messages=messages,
                        result_format='message'
                    )
            
            if response.status_code == 200:
                content = response.output.choices[0].message.content
                return LLMResponse(
                    content=content,
                    raw_response=response,
                    model_name=model,
                    usage={
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens
                    }
                )
            else:
                raise Exception(f"Qwen API Error {response.code}: {response.message}")

        except Exception as e:
            raise Exception(f"Qwen Client Exception: {str(e)}")

    def chat_stream(self, messages: List[Dict[str, str]], **kwargs):
        model = kwargs.get("model", self.default_model)
        responses = Generation.call(
            model=model,
            messages=messages,
            result_format='message',
            stream=True,
            incremental_output=True 
        )
        for response in responses:
            if response.status_code == 200:
                yield response.output.choices[0].message.content
            else:
                raise Exception(f"Stream Error: {response.message}")
