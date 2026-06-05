from sqlalchemy.orm import Session
from app.models.database import Conversation, Message
from typing import List, Optional

class MemoryService:
    def __init__(self, db: Session):
        self.db = db

    def create_conversation(self, title: Optional[str] = None):
        db_conv = Conversation(title=title)
        self.db.add(db_conv)
        self.db.commit()
        self.db.refresh(db_conv)
        return db_conv

    def add_message(self, conversation_id: int, role: str, content: str):
        db_message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        self.db.add(db_message)
        self.db.commit()
        self.db.refresh(db_message)
        return db_message

    def get_messages(self, conversation_id: int):
        return self.db.query(Message).filter(Message.conversation_id == conversation_id).all()

    def get_all_conversations(self):
        return self.db.query(Conversation).all()
