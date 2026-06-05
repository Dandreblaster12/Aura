import os
import whisper
import torch
from fastapi import UploadFile
from app.core.config import settings

class VoiceService:
    def __init__(self):
        self.model_name = settings.WHISPER_MODEL
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._model = None

    @property
    def model(self):
        if self._model is None:
            # Lazy load the model
            self._model = whisper.load_model(self.model_name, device=self.device)
        return self._model

    async def transcribe(self, file: UploadFile) -> str:
        # Save file temporarily
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        try:
            # Actual Whisper transcription
            result = self.model.transcribe(file_path)
            return result["text"].strip()
        except Exception as e:
            return f"Transcription error: {str(e)}"
        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)

    async def synthesize(self, text: str) -> str:
        # Placeholder for TTS
        # Could use pyttsx3 or a cloud API
        output_filename = "response.wav"
        output_path = os.path.join(settings.UPLOAD_DIR, output_filename)
        
        # Logic to generate audio
        with open(output_path, "w") as f:
            f.write("mock audio data")
            
        return output_path
