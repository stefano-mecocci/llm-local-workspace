import time
from typing import AsyncGenerator, List, Optional

import ollama
from sqlmodel import Session, delete, select

from app.config import MESSAGES_PAGE_SIZE, engine
from app.models import (
    ChatPage,
    FrontendChatMessage,
    LlmRoles,
    MessageRow,
)


def add_message(
    chat_id: str,
    role: LlmRoles,
    content: str,
    timestamp: int,
    images: Optional[List[str]] = None,
) -> None:
    row = MessageRow(
        chat_id=chat_id,
        role=role,
        content=content,
        timestamp=timestamp,
        images=",".join(images) if images else None,
    )
    with Session(engine) as session:
        session.add(row)
        session.commit()


def row_to_frontend_message(row: MessageRow) -> FrontendChatMessage:
    return FrontendChatMessage(
        role=row.role,
        content=row.content,
        images=row.images.split(",") if row.images else None,
        timestamp=row.timestamp,
    )


def fetch_chat_messages(chat_id: str) -> List[FrontendChatMessage]:
    with Session(engine) as session:
        stmt = (
            select(MessageRow)
            .where(MessageRow.chat_id == chat_id)
            .order_by(MessageRow.timestamp.asc(), MessageRow.id.asc())
        )
        rows = session.exec(stmt).all()
    return [row_to_frontend_message(row) for row in rows]


def fetch_chat_page(
    chat_id: str,
    limit: int = MESSAGES_PAGE_SIZE,
    before: Optional[int] = None,
) -> ChatPage:
    with Session(engine) as session:
        stmt = select(MessageRow).where(MessageRow.chat_id == chat_id)
        if before is not None:
            stmt = stmt.where(MessageRow.timestamp < before)
        stmt = stmt.order_by(MessageRow.timestamp.asc(), MessageRow.id.asc())
        older_rows = session.exec(stmt).all()

    if not older_rows:
        return ChatPage(messages=[], hasMore=False)

    older_messages = [row_to_frontend_message(row) for row in older_rows]
    page = older_messages[-limit:]
    has_more = len(older_messages) > limit

    return ChatPage(messages=page, hasMore=has_more)


def get_chat_ids() -> List[str]:
    with Session(engine) as session:
        stmt = select(MessageRow.chat_id).distinct()
        chat_ids = session.exec(stmt).all()
    return list(chat_ids)


def clean_db() -> None:
    with Session(engine) as session:
        session.exec(delete(MessageRow))
        session.commit()


def _remove_timestamps(
    messages: List[FrontendChatMessage],
) -> List[dict]:
    return [
        {k: v for k, v in m.model_dump().items() if k != "timestamp"}
        for m in messages
    ]


async def generate_llm_stream(
    chat_id: str, model: str
) -> AsyncGenerator[str, None]:
    messages = fetch_chat_messages(chat_id)
    ollama_messages = _remove_timestamps(messages)

    client = ollama.AsyncClient()
    stream = await client.chat(
        model=model,
        messages=ollama_messages,
        stream=True,
    )

    ai_response = ""

    async for chunk in stream:
        content = chunk.message.content
        if content:
            ai_response += content
            yield content

    add_message(chat_id, LlmRoles.ASSISTANT, ai_response, int(time.time()))


async def generate_llm_vision_stream(
    chat_id: str, model: str
) -> AsyncGenerator[str, None]:
    messages = fetch_chat_messages(chat_id)
    ollama_messages = _remove_timestamps(messages)

    client = ollama.AsyncClient()
    stream = await client.chat(
        model=model,
        messages=ollama_messages,
        stream=True,
    )

    ai_response = ""

    async for chunk in stream:
        content = chunk["message"]["content"]
        if content:
            ai_response += content
            yield content

    add_message(chat_id, LlmRoles.ASSISTANT, ai_response, int(time.time()))