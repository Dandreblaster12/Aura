from app.services.llm_service import LLMService
from typing import List, Dict
import json
import os
from PyPDF2 import PdfReader
from docx import Document

class StudyService:
    def __init__(self):
        self.llm = LLMService()

    async def extract_text(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        text = ""
        if ext == ".pdf":
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text()
        elif ext == ".docx":
            doc = Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        return text

    async def summarize(self, text: str) -> str:
        prompt = f"Summarize the following text in a concise and informative way:\n\n{text}"
        return await self.llm.generate_response(prompt)

    async def generate_quiz(self, text: str) -> List[Dict]:
        prompt = f"""
        Based on the following text, generate 5 multiple-choice questions for a quiz.
        Text: "{text}"
        
        Return the result as a JSON array of objects with the following structure:
        [
            {{
                "question": "question text",
                "options": ["option A", "option B", "option C", "option D"],
                "correct_answer": "correct option"
            }}
        ]
        """
        if not self.llm.client:
             return []
             
        try:
            response = self.llm.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                response_format={ "type": "json_object" }
            )
            data = json.loads(response.choices[0].message.content)
            # Ensure it's a list
            if isinstance(data, dict) and "quiz" in data:
                return data["quiz"]
            elif isinstance(data, list):
                return data
            return []
        except Exception:
            return []
