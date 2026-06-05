from fastapi import APIRouter, UploadFile, File
from typing import List
from app.services.study_service import StudyService
from app.models.schemas import SummarizeRequest, QuizResponse

router = APIRouter()
study_service = StudyService()

@router.post("/summarize")
async def summarize(request: SummarizeRequest):
    summary = await study_service.summarize(request.text)
    return {"summary": summary}

@router.post("/generate-quiz", response_model=List[QuizResponse])
async def generate_quiz(request: SummarizeRequest):
    quiz = await study_service.generate_quiz(request.text)
    return quiz
