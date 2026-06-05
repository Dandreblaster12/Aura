from fastapi import APIRouter, UploadFile, File
from app.services.voice_service import VoiceService

router = APIRouter()
voice_service = VoiceService()

@router.post("/stt")
async def speech_to_text(file: UploadFile = File(...)):
    text = await voice_service.transcribe(file)
    return {"text": text}

@router.post("/tts")
async def text_to_speech(text: str):
    audio_path = await voice_service.synthesize(text)
    return {"audio_url": audio_path}
