import base64
import time
from typing import Dict, List, Optional

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import ollama
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum

from pydantic import BaseModel


class LlmRoles(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: LlmRoles
    content: str
    images: Optional[List[str]] = None


class FrontendChatMessage(ChatMessage):
    timestamp: int


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

messages_db: Dict[str, List[FrontendChatMessage]] = {}


def add_ai_message(messages: List[FrontendChatMessage], content: str):
    messages.append({
        "role": LlmRoles.ASSISTANT,
        "content": content,
        "timestamp": int(time.time()),
    })


def remove_key_from_list(data_list: list[dict], key_to_remove: str) -> list[dict]:
    return [{k: v for k, v in d.items() if k != key_to_remove} for d in data_list]


async def generate_llm_stream(chat_id: str, model: str):
    messages = messages_db[chat_id]
    ollama_messages: List[ChatMessage] = remove_key_from_list(messages, "timestamp")

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

    add_ai_message(messages, ai_response)


async def generate_llm_vision_stream(chat_id: str, model: str):
    messages = messages_db[chat_id]
    ollama_messages: List[ChatMessage] = remove_key_from_list(messages, "timestamp")

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

    add_ai_message(messages, ai_response)


@app.get("/stream")
async def stream_endpoint(chat_id: str, prompt: str, model: str):
    if chat_id not in messages_db:
        messages_db[chat_id] = []

    messages = messages_db[chat_id]
    messages.append({
        "role": LlmRoles.USER,
        "content": prompt,
        "timestamp": int(time.time()),
    })

    return StreamingResponse(
        generate_llm_stream(chat_id, model),
        media_type="text/plain",
    )


@app.post("/stream-vision")
async def stream_vision_endpoint(
    chat_id: str = Form(...),
    model: str = Form(...),
    prompt: str = Form(...),
    image: UploadFile = File(...),
):
    image_bytes = await image.read()

    if chat_id not in messages_db:
        messages_db[chat_id] = []

    messages = messages_db[chat_id]
    base64image = base64.b64encode(image_bytes).decode("utf-8")
    messages.append({
        "role": LlmRoles.USER,
        "content": prompt,
        "images": [base64image],
        "timestamp": int(time.time()),
    })

    return StreamingResponse(
        generate_llm_vision_stream(chat_id, model),
        media_type="text/plain",
    )


@app.get("/chat_ids")
async def get_chat_ids():
    return list(messages_db.keys())


@app.get("/clean_db")
async def clean_db():
    global messages_db

    messages_db = {}

    return messages_db


@app.get("/fetch_chat", response_model=List[FrontendChatMessage])
async def fetch_chat(chat_id: str):
    if chat_id not in messages_db:
        return []

    return messages_db[chat_id]
