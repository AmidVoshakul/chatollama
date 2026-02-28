from typing import List, Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class Chat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)  # ✅ добавлено

    messages: List["Message"] = Relationship(
        back_populates="chat",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: int = Field(foreign_key="chat.id")
    role: str
    content: str
    model: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    chat: Optional[Chat] = Relationship(back_populates="messages")
