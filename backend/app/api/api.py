from fastapi import APIRouter
from app.api.endpoints import chat, voice, settings as settings_endpoint, study, command, content

api_router = APIRouter()
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])
api_router.include_router(settings_endpoint.router, prefix="/settings", tags=["settings"])
api_router.include_router(study.router, prefix="/study", tags=["study"])
api_router.include_router(command.router, prefix="/command", tags=["command"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
