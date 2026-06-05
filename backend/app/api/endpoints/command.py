from fastapi import APIRouter, Depends
from app.models.schemas import CommandRequest, CommandResponse
from app.services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()

@router.post("/", response_model=CommandResponse)
async def interpret_command(request: CommandRequest):
    interpretation = await llm_service.interpret_command(request.text)
    return CommandResponse(
        module=interpretation.get("module", "chat"),
        action=interpretation.get("action", "respond"),
        data=interpretation.get("data", {})
    )
