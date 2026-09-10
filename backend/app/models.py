from enum import Enum
from typing import List, Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class LlmRoles(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: LlmRoles
    content: str
    images: Optional[List[str]] = None


class FrontendChatMessage(ChatMessage):
    timestamp: int


class ChatPage(BaseModel):
    messages: List[FrontendChatMessage]
    hasMore: bool


class MessageRow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: str = Field(index=True)
    role: LlmRoles
    content: str
    images: Optional[str] = Field(default=None)
    timestamp: int = Field(index=True)