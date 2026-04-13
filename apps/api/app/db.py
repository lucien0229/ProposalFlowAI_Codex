from __future__ import annotations

import os
from functools import lru_cache

from sqlalchemy import Engine, create_engine

from app import metadata


def get_database_url() -> str:
    try:
        database_url = os.environ["DATABASE_URL"]
    except KeyError as exc:
        raise RuntimeError("DATABASE_URL must be set to a PostgreSQL URL.") from exc

    if not database_url.startswith("postgresql"):
        raise RuntimeError("DATABASE_URL must point to PostgreSQL.")

    return database_url


@lru_cache(maxsize=None)
def _build_engine(database_url: str) -> Engine:
    return create_engine(database_url, future=True)


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
