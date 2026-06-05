from openai import OpenAI
from app.core.config import settings
from typing import List, Dict

class LLMService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    async def generate_response(self, message: str, history: List[Dict] = None) -> str:
        if not self.client:
            return f"Mock response: I received your message: '{message}'. (OpenAI API key not configured)"
        
        try:
            messages = []
            if history:
                for msg in history:
                    messages.append({"role": msg.role, "content": msg.content})
            
            messages.append({"role": "user", "content": message})
            
            response = self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating response: {str(e)}"

    async def interpret_command(self, text: str) -> Dict:
        """
        Interprets natural language text and returns the intended module and action.
        """
        prompt = f"""
        Analyze the following user input and determine the intended module and action.
        Possible modules: study, 3d, pc-control, content, chat.
        
        Examples:
        "Summarize this PDF" -> {{"module": "study", "action": "summarize"}}
        "Show me a 3D model of a car" -> {{"module": "3d", "action": "view_model"}}
        "Open Chrome" -> {{"module": "pc-control", "action": "open_app"}}
        "Create a TikTok script about AI" -> {{"module": "content", "action": "generate_script"}}
        "How are you?" -> {{"module": "chat", "action": "respond"}}
        
        Input: "{text}"
        Return JSON only.
        """
        
        if not self.client:
            return {"module": "chat", "action": "respond"}

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo", # Use faster model for classification
                messages=[{"role": "user", "content": prompt}],
                response_format={ "type": "json_object" }
            )
            import json
            return json.loads(response.choices[0].message.content)
        except Exception:
            return {"module": "chat", "action": "respond"}
