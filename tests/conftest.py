from __future__ import annotations

import os
from dataclasses import dataclass

import pytest


@dataclass(frozen=True)
class SmokeURLs:
    web: str
    admin: str


@pytest.fixture(scope="session")
def smoke_urls() -> SmokeURLs:
    return SmokeURLs(
        web=os.environ.get("SMOKE_WEB_URL", "http://127.0.0.1:3000"),
        admin=os.environ.get("SMOKE_ADMIN_URL", "http://127.0.0.1:3001"),
    )
