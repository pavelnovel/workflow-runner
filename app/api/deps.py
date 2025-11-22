"""FastAPI dependencies."""

from __future__ import annotations

from typing import Generator

from sqlalchemy.orm import Session

from app.database import get_session


def db_session() -> Generator[Session, None, None]:
    yield from get_session()

