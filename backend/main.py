import base64
from typing import List

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import ollama
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum

MODEL = "gemma4:e2b"


class LlmRoles(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

messages_db = {}


async def generate_llm_stream(messages: List, model: str):
    client = ollama.AsyncClient()
    stream = await client.chat(
        model=model,
        messages=messages,
        stream=True,
    )

    ai_response = ""

    async for chunk in stream:
        content = chunk.message.content
        if content:
            ai_response += content
            yield content

    messages.append({"role": LlmRoles.ASSISTANT, "content": ai_response})


async def generate_llm_vision_stream(messages: List, model: str):
    client = ollama.AsyncClient()
    stream = await client.chat(
        model=model,
        messages=messages,
        stream=True,
    )

    ai_response = ""

    async for chunk in stream:
        content = chunk["message"]["content"]
        if content:
            ai_response += content
            yield content

    messages.append({"role": LlmRoles.ASSISTANT, "content": ai_response})


@app.get("/stream")
async def stream_endpoint(chat_id: str, prompt: str, model: str):
    if chat_id not in messages_db:
        messages_db[chat_id] = []

    messages = messages_db[chat_id]
    messages.append({"role": LlmRoles.USER, "content": prompt})

    return StreamingResponse(
        generate_llm_stream(messages, model),
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
    })

    return StreamingResponse(
        generate_llm_vision_stream(messages, model),
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


@app.get("/fetch_chat")
async def fetch_chat(chat_id: str):
    if chat_id not in messages_db:
        return []

    return messages_db[chat_id]
