import base64
import time
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import StreamingResponse

from app.config import MESSAGES_PAGE_SIZE
from app.models import ChatPage, LlmRoles
from app.services import (
    add_message,
    clean_db,
    fetch_chat_page,
    generate_llm_stream,
    generate_llm_vision_stream,
    get_chat_ids,
)

router = APIRouter()


@router.get("/stream")
async def stream_endpoint(chat_id: str, prompt: str, model: str):
    add_message(chat_id, LlmRoles.USER, prompt, int(time.time()))

    return StreamingResponse(
        generate_llm_stream(chat_id, model),
        media_type="text/plain",
    )


@router.post("/stream-vision")
async def stream_vision_endpoint(
    chat_id: str = Form(...),
    model: str = Form(...),
    prompt: str = Form(...),
    image: UploadFile = File(...),
):
    image_bytes = await image.read()
    base64image = base64.b64encode(image_bytes).decode("utf-8")

    add_message(
        chat_id,
        LlmRoles.USER,
        prompt,
        int(time.time()),
        images=[base64image],
    )

    return StreamingResponse(
        generate_llm_vision_stream(chat_id, model),
        media_type="text/plain",
    )


@router.get("/chat_ids")
async def chat_ids_endpoint():
    return get_chat_ids()


@router.get("/clean_db")
async def clean_db_endpoint():
    clean_db()
    return {}


@router.get("/fetch_chat", response_model=ChatPage)
async def fetch_chat_endpoint(
    chat_id: str, limit: int = MESSAGES_PAGE_SIZE, before: Optional[int] = None
):
    page = fetch_chat_page(chat_id, limit=limit, before=before)
    return page
