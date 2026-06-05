from pydantic import BaseModel
from typing import List, Optional, Dict

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    conversation_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str

class SettingsUpdate(BaseModel):
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    llm_model: Optional[str] = None

class CommandRequest(BaseModel):
    text: str

class CommandResponse(BaseModel):
    module: str
    action: str
    data: Optional[Dict] = {}

class SummarizeRequest(BaseModel):
    text: str

class QuizResponse(BaseModel):
    question: str
    options: List[str]
    correct_answer: str

class ContentScriptRequest(BaseModel):
    topic: str

class ContentScriptResponse(BaseModel):
    script: str

class VideoGenerateRequest(BaseModel):
    script: str
    music: Optional[str] = "Cyberpunk Night"
    voice: Optional[str] = "Echo"

class VideoGenerateResponse(BaseModel):
    video_id: str
    status: str
    url: Optional[str] = None

class ThumbnailGenerateRequest(BaseModel):
    prompt: str
    aspect_ratio: Optional[str] = "9:16"
