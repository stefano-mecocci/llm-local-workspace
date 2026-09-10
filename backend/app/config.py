import os

from sqlmodel import create_engine


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://stefano@localhost:5432/app",
)

MESSAGES_PAGE_SIZE = 4

engine = create_engine(DATABASE_URL, echo=False)