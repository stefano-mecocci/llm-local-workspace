from sqlmodel import Session, SQLModel

from app.config import engine


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():  # type: ignore
    with Session(engine) as session:
        yield session