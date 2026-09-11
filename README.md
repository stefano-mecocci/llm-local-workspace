# Local LLM Workspace

A self-hosted chat workspace for running conversations against local LLMs. This monorepo pairs a **FastAPI** backend that streams responses from [Ollama](https://ollama.com) with an **Angular** frontend, and persists every conversation in PostgreSQL so chat history survives restarts.

![Local LLM Workspace screenshot](other/screenshot-september-2026.png)

## Features

- Real-time token-by-token streaming responses (text/plain streams)
- Vision prompts: paste or attach an image and query multimodal models
- Multiple chats with a sidebar and persistent history
- Paginated message loading for long conversations
- Model switcher listing all chat-capable models installed in Ollama
- Markdown rendering of AI responses with copy-to-clipboard
- Responsive layout with mobile sidebar overlay

## Tech Stack

| Layer    | Technology                                                       |
| -------- | ---------------------------------------------------------------- |
| Frontend | Angular 22 (standalone components, signals), PrimeNG, Tailwind CSS 4, ngx-markdown |
| Backend  | Python 3.14, FastAPI, SQLModel, Ollama Python client              |
| Storage  | PostgreSQL                                   |
| Tooling  | `uv` (Python), `npm` (JS)                                        |

## Repository Structure

```
.
├── backend/          # FastAPI application
│   ├── main.py       # App entrypoint, CORS setup, DB init on startup
│   └── app/
│       ├── config.py     # DATABASE_URL and engine settings
│       ├── models.py     # SQLModel table + Pydantic schemas
│       ├── database.py   # Session / schema helpers
│       ├── services.py   # Ollama streaming + chat persistence logic
│       └── routes.py     # API endpoints
├── frontend/         # Angular application
│   └── src/app/
│       ├── components/   # Layout, chat, messages, prompt box, sidebar
│       ├── generated/    # Ollama model list (created by scripts/generate_models.py, gitignored)
│       ├── services/     # ChatState (signals-based store, SSE consumption)
│       ├── routes.ts     # Lazy-loaded routes: home and chat/:id
│       └── utils/        # Helpers (base64 encoding, random ids)
├── scripts/          # Pre-run tooling
│   └── generate_models.py  # Generates the frontend model list from Ollama
└── AGENTS.md         # Global agent/contributor guidelines
```

## Prerequisites

- [Ollama](https://ollama.com) installed and running locally, with at least one model pulled (e.g. `ollama pull gemma4:e2b`)
- Python 3.14+ and [uv](https://docs.astral.sh/uv/)
- Node.js (matching Angular 22 requirements) and npm
- A running PostgreSQL instance

## Getting Started

### 1. Configure the database

Create a PostgreSQL database and point the backend at it via the `DATABASE_URL` environment variable (defaults to `postgresql+psycopg://stefano@localhost:5432/app`):

```bash
export DATABASE_URL="postgresql+psycopg://user:password@localhost:5432/app"
```

The schema is created automatically on backend startup.

### 2. Generate the model list

With Ollama running, generate the list of chat-capable models used by the frontend model switcher:

```bash
python3 scripts/generate_models.py
```

The script queries Ollama (`OLLAMA_HOST`, default `http://localhost:11434`) and writes `frontend/src/app/generated/ollama-models.ts` (gitignored). Re-run it whenever you pull or remove models, and before every fresh build.

### 3. Run the backend

```bash
cd backend
uv sync
uv run fastapi dev main.py
```

The API is served at `http://localhost:8000` (interactive docs at `http://localhost:8000/docs`).

### 4. Run the frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200`. In development, requests to `/api/*` are proxied to the backend on port 8000 (see `frontend/src/proxy.conf.json`).

## API Reference

| Method | Endpoint         | Description                                              |
| ------ | ---------------- | -------------------------------------------------------- |
| GET    | `/stream`        | Stream a chat completion (`chat_id`, `prompt`, `model`)  |
| POST   | `/stream-vision` | Stream a vision completion (multipart form with `image`) |
| GET    | `/chat_ids`      | List all stored chat IDs                                  |
| GET    | `/fetch_chat`    | Fetch a page of messages (`chat_id`, `limit`, `before`)  |
| GET    | `/clean_db`      | Delete all stored messages                                |

## Scripts

**Backend** (from `backend/`):

- `uv sync` — install dependencies
- `uv run fastapi dev main.py` — start the dev server

**Frontend** (from `frontend/`):

- `npm start` — start the dev server (port 4200, with API proxy)
- `npm run build` — production build
- `npm test` — run unit tests

**Tooling** (from the repository root):

- `python3 scripts/generate_models.py` — regenerate the frontend model list from the local Ollama instance (required before starting the app)

## Contributing

See [AGENTS.md](AGENTS.md) for repository-wide conventions, and the framework-specific guidance in `frontend/AGENTS.md`.
