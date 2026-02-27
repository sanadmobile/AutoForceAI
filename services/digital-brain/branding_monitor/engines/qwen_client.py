import os
import json
import dashscope
from dashscope import Generation

class QwenClient:
    """
    阿里通义千问 (Qwen) 客户端
    使用 DashScope API，并启用搜索插件
    """
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            print("[Warn] 未检测到 DASHSCOPE_API_KEY")
            self.client = None
        else:
            dashscope.api_key = self.api_key

    def query(self, prompt: str, enable_search: bool = True) -> str:
        """
        发送查询请求，尝试启用 Search 插件，失败则降级为普通对话
        """
        if not dashscope.api_key:
            # raise ValueError("DashScope API Key is missing.")
            print("[QwenClient] No API Key. Returning Mock Data.")
            
            # Simple heuristic to Mock JSON Analysis responses if requested
            if "JSON" in prompt and ("rank_position" in prompt or "sentiment_score" in prompt):
                return """
                {
                    "is_mentioned": true,
                    "rank_position": 3,
                    "sentiment_score": 7,
                    "reasoning": "Mock Analysis: Brand appears in search results with generally positive sentiment.",
                    "suggestions": ["Improve keyword density", "Add more backlinks"],
                    "citations": ["[1]", "[2]"]
                }
                """
            
            # Mock for PPT Solution Generator
            if "strictly JSON" in prompt and "Slide Title" in prompt:
                 return """
                 {
                    "title": "Mock Generated Slide",
                    "bullets": ["This is a simulated response.", "DashScope API Key is missing.", "Please configure .env file."], 
                    "image_suggestion": "A placeholder image showing system configuration.",
                    "speaker_notes": "Remind the user to set up their API keys."
                 }
                 """

            if "strictly a JSON array" in prompt and "presentation outline" in prompt:
                 return """
                 [
                    {"page": 1, "title": "Mock Solution (No API Key)", "type": "cover"},
                    {"page": 2, "title": "Agenda", "type": "catalog"},
                    {"page": 3, "title": "System Check", "type": "content", "key_points_hint": "Check .env configuration"}
                 ]
                 """

            return f"[Simulated AI Answer for '{prompt}']\nBased on general knowledge, this brand is well regarded..."

        try:
            # 1. 尝试调用带搜索功能的接口 (First try enable_search=True)
            response = Generation.call(
                model='qwen-max',
                messages=[{'role': 'user', 'content': prompt}],
                result_format='message',
                enable_search=enable_search  # Use parameter
            )

            if response.status_code == 200:
                if enable_search:
                     print(f"[QwenClient] Qwen-Max Search Success.")
                return response.output.choices[0].message.content

            # Check for Plugin/Search errors to fallback
            # e.g. "InvalidParameter" if enable_search is not supported, or plugin errors
            is_plugin_error = (
                "InvalidPlugin" in str(response.code) or 
                "NotExist" in str(response.code) or
                "plugin" in str(response.message).lower() or
                "parameter" in str(response.message).lower() # For invalid enable_search
            )

            if is_plugin_error:
                # 2. 如果搜索功能不可用，自动降级为普通模式
                print(f"[Warn] Qwen 搜索功能不可用 ({response.code})，已自动切换为标准模式(无联网)...")
                response_fallback = Generation.call(
                    model='qwen-max',
                    messages=[{'role': 'user', 'content': prompt}],
                    result_format='message'
                )
                if response_fallback.status_code == 200:
                    return response_fallback.output.choices[0].message.content
                else:
                    return f"Error (Fallback): {response_fallback.code} - {response_fallback.message}"
            else:
                # 真实报错：直接返回错误详情，方便用户调试配置
                error_msg = f"Qwen API Error: {response.code} - {response.message}"
                print(f"[Error] {error_msg}")
                # return self._get_mock_json() # Disable Mock for debugging
                return json.dumps({
                    "is_mentioned": False, 
                    "rank_position": -1,
                    "sentiment_score": 0,
                    "reasoning": f"API Configuration Error: {response.message} (Code: {response.code}). Please check your DASHSCOPE_API_KEY in .env.",
                    "suggestions": ["Check API Key", "Check Account Balance"], 
                    "citations": []
                })
            
        except Exception as e:
            print(f"[Error] Qwen Client Exception: {e}")
             # return self._get_mock_json() # Disable Mock for debugging
            return json.dumps({
                "is_mentioned": False,
                "rank_position": -1,
                "sentiment_score": 0,
                "reasoning": f"System Error: {str(e)}",
                "suggestions": ["Check Network", "Check Python Logs"],
                "citations": []
            })

    def _get_mock_json(self):
        return """
        {
            "is_mentioned": true,
            "rank_position": 3,
            "sentiment_score": 8,
            "reasoning": "AI Simulation: Brand detected in top tiers with positive user feedback.",
            "suggestions": ["Optimized knowledge graph coverage", "Enhance social media presence"],
            "citations": ["[1] TechReview", "[2] IndustryReport"]
        }
        """
