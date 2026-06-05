from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/")
async def get_settings():
    return {
        "project_name": settings.PROJECT_NAME,
        "llm_model": settings.LLM_MODEL,
        "whisper_model": settings.WHISPER_MODEL
    }

@router.post("/")
async def update_settings(new_settings: dict):
    # Logic to update settings (could be saving to a JSON or DB)
    return {"status": "success"}
