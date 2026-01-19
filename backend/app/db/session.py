from __future__ import annotations
from typing import Generator
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import get_settings


def get_engine():
    settings = get_settings()
    return create_engine(settings.database_url, pool_pre_ping=True)


engine = get_engine()


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
