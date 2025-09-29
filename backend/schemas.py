from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import os

DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "qwen2.5-coder:0.5b")


class MessageCreate(BaseModel):
    role: str
    content: str
    model: str = Field(default=DEFAULT_MODEL)


class ChatCreate(BaseModel):
    title: str


class ChatRead(BaseModel):
    id: int
    title: str
    created_at: datetime


class MessageRead(BaseModel):
    id: int
    role: str
    content: str
    model: Optional[str]
    created_at: datetime
