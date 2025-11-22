"""Application-wide settings loaded from environment."""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field


load_dotenv()


class Settings(BaseModel):
    api_prefix: str = Field(default=os.getenv("API_PREFIX", "/api/v1"))
    database_url: str = Field(
        default=os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://postgres:postgres@localhost:5432/process_ave",
        )
    )
    db_pool_size: int = Field(default=int(os.getenv("DB_POOL_SIZE", "10")))
    db_max_overflow: int = Field(default=int(os.getenv("DB_MAX_OVERFLOW", "5")))
    db_echo: bool = Field(default=os.getenv("DB_ECHO", "false").lower() == "true")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

