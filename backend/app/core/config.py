import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AURA AI Backend"
    API_V1_STR: str = "/api/v1"
    
    # AI Keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    
    # Models
    LLM_MODEL: str = "gpt-4-turbo-preview"
    WHISPER_MODEL: str = "base"
    
    # Storage
    UPLOAD_DIR: str = "uploads"
    MEMORY_DIR: str = "memory"
    DATABASE_URL: str = f"sqlite:///{os.path.join(os.getcwd(), 'aura.db')}"
    
    class Config:
        case_sensitive = True

settings = Settings()
