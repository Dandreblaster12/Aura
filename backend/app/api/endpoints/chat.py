from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.schemas import ChatRequest, ChatResponse
from app.services.llm_service import LLMService
from app.services.memory_service import MemoryService
from app.core.database import get_db
from typing import Optional

router = APIRouter()
llm_service = LLMService()

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    memory_service = MemoryService(db)
    
    conversation_id = request.conversation_id
    
    # If no conversation_id, create a new one
    if not conversation_id:
        conv = memory_service.create_conversation(title=request.message[:50])
        conversation_id = conv.id
    
    # Store user message
    memory_service.add_message(conversation_id, "user", request.message)
    
    # Get history from DB if needed (or use request.history as before)
    # For now, let's use the provided history for consistency with the schema, 
    # but store everything in DB.
    
    response = await llm_service.generate_response(request.message, request.history)
    
    # Store assistant response
    memory_service.add_message(conversation_id, "assistant", response)
    
    return ChatResponse(response=response)
