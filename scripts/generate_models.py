#!/usr/bin/env python3
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

OUTPUT_FILE = (
    Path(__file__).resolve().parent.parent
    / "frontend"
    / "src"
    / "app"
    / "generated"
    / "ollama-models.ts"
)


def ollama_tags_url() -> str:
    host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    if "://" not in host:
        host = f"http://{host}"
    return f"{host.rstrip('/')}/api/tags"


def fetch_models() -> list[dict]:
    with urllib.request.urlopen(ollama_tags_url(), timeout=10) as response:
        return json.load(response).get("models", [])


def chat_capable_models(models: list[dict]) -> list[str]:
    return [
        model["name"]
        for model in models
        if "completion" in model.get("capabilities", [])
    ]


def write_models_ts(models: list[str]) -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    entries = ",\n".join(f"  '{name}'" for name in models)
    OUTPUT_FILE.write_text(
        f"export const OLLAMA_MODELS = [\n{entries},\n];\n", encoding="utf-8"
    )


def main() -> None:
    try:
        models = fetch_models()
    except urllib.error.URLError as error:
        sys.exit(f"Cannot reach Ollama at {ollama_tags_url()}: {error}")

    models = chat_capable_models(models)
    if not models:
        sys.exit("No chat-capable models found. Pull one first, e.g.: ollama pull gemma4:e2b")

    write_models_ts(models)
    print(f"Generated {OUTPUT_FILE} with {len(models)} chat-capable models:")
    for name in models:
        print(f"  {name}")


if __name__ == "__main__":
    main()
