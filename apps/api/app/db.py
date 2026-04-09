from __future__ import annotations

import os
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.pool import StaticPool

from app import metadata

DEFAULT_DATABASE_URL = "sqlite+pysqlite:///./proposalflow.local.db"


def get_database_url() -> str:
    return os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)


@lru_cache(maxsize=None)
def _build_engine(database_url: str) -> Engine:
    kwargs: dict[str, object] = {"future": True}
    if database_url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        if ":memory:" in database_url:
            kwargs["poolclass"] = StaticPool
    return create_engine(database_url, **kwargs)


def get_engine(database_url: str | None = None) -> Engine:
    return _build_engine(database_url or get_database_url())


def clear_engine_cache() -> None:
    _build_engine.cache_clear()


def ensure_database_schema(database_url: str | None = None) -> None:
    engine = get_engine(database_url)
    metadata.create_all(engine)


def reset_database(database_url: str | None = None) -> None:
    engine = get_engine(database_url)
    metadata.drop_all(engine)
    metadata.create_all(engine)
