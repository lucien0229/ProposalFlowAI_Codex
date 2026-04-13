from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Callable, Iterator

import psycopg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import insert
from sqlalchemy.engine import make_url
from psycopg import sql

ROOT = Path(__file__).resolve().parents[1]
API_APP_ROOT = ROOT / "apps" / "api"

for path in (ROOT, API_APP_ROOT):
    path_text = str(path)
    if path_text not in sys.path:
        sys.path.insert(0, path_text)

from app.account_models import (
    user_sessions_table,
    users_table,
    workspace_members_table,
    workspaces_table,
)
from app.db import clear_engine_cache, get_engine, reset_database
from app.main import create_app
from tests.support.file_processing_fakes import InMemoryObjectStore, InlineQueue


TEST_DATABASE_URL = os.environ.get(
    "PROPOSALFLOW_TEST_DATABASE_URL",
    "postgresql+psycopg://proposalflow:proposalflow@127.0.0.1:5432/proposalflow_test",
)


@dataclass(frozen=True)
class SmokeURLs:
    web: str
    admin: str


@dataclass(frozen=True)
class AuthenticatedWebSession:
    session_id: str
    csrf_token: str
    workspace_id: str
    user_id: str

    def cookie_header(self) -> str:
        return f"pf_web_session={self.session_id}; pf_csrf_token={self.csrf_token}"

    def read_header_map(self) -> dict[str, str]:
        return {
            "cookie": self.cookie_header(),
            "x-workspace-id": self.workspace_id,
            "x-user-id": self.user_id,
        }

    def write_header_map(self) -> dict[str, str]:
        return {
            **self.read_header_map(),
            "x-csrf-token": self.csrf_token,
        }


@pytest.fixture(scope="session")
def smoke_urls() -> SmokeURLs:
    return SmokeURLs(
        web=os.environ.get("SMOKE_WEB_URL", "http://127.0.0.1:3000"),
        admin=os.environ.get("SMOKE_ADMIN_URL", "http://127.0.0.1:3001"),
    )


@pytest.fixture
def fake_queue() -> InlineQueue:
    return InlineQueue()


@pytest.fixture
def fake_object_store() -> InMemoryObjectStore:
    return InMemoryObjectStore()


@pytest.fixture
def api_database_url() -> str:
    return TEST_DATABASE_URL


def ensure_postgres_database(database_url: str) -> None:
    url = make_url(database_url)
    if not url.drivername.startswith("postgresql"):
        raise RuntimeError(f"Expected a PostgreSQL DATABASE_URL, got {database_url!r}.")
    if not url.database:
        raise RuntimeError("DATABASE_URL must include a database name.")

    admin_url = url.set(drivername="postgresql", database="postgres").render_as_string(hide_password=False)
    with psycopg.connect(admin_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            cursor.execute("select 1 from pg_database where datname = %s", (url.database,))
            if cursor.fetchone() is None:
                cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(url.database)))


@pytest.fixture
def api_client(
    api_database_url: str,
    fake_queue: InlineQueue,
    fake_object_store: InMemoryObjectStore,
) -> Iterator[TestClient]:
    previous_database_url = os.environ.get("DATABASE_URL")
    ensure_postgres_database(api_database_url)
    os.environ["DATABASE_URL"] = api_database_url
    clear_engine_cache()
    reset_database(api_database_url)

    app = create_app()
    app.state.file_queue = fake_queue
    app.state.object_store = fake_object_store

    with TestClient(app) as client:
        yield client

    clear_engine_cache()
    if previous_database_url is None:
        os.environ.pop("DATABASE_URL", None)
    else:
        os.environ["DATABASE_URL"] = previous_database_url


@pytest.fixture
def authenticated_web_session(api_client: TestClient) -> AuthenticatedWebSession:
    now = datetime.now(UTC)
    workspace_id = "workspace_test"
    user_id = "user_test"
    session_id = "sess_test"
    csrf_token = "csrf_test"

    with get_engine().begin() as connection:
        connection.execute(
            insert(users_table).values(
                id=user_id,
                email="owner@example.com",
                full_name="Test Owner",
                password_hash="not-used-in-api-tests",
                primary_auth_provider="password",
                is_active=True,
                created_at=now,
                updated_at=now,
            )
        )
        connection.execute(
            insert(workspaces_table).values(
                id=workspace_id,
                name="North Star Studio",
                industry_type="web_development_agency",
                default_template_key="development_agency",
                default_tone_preference="direct",
                trial_status="active",
                trial_start_at=now - timedelta(days=7),
                trial_end_at=now + timedelta(days=7),
                billing_status="active",
                plan_type="starter",
                stripe_customer_id=None,
                stripe_subscription_id=None,
                current_period_end=now + timedelta(days=30),
                created_at=now,
                updated_at=now,
            )
        )
        connection.execute(
            insert(workspace_members_table).values(
                workspace_id=workspace_id,
                user_id=user_id,
                role="owner",
                joined_at=now,
                is_active=True,
            )
        )
        connection.execute(
            insert(user_sessions_table).values(
                id=session_id,
                user_id=user_id,
                session_type="web",
                session_status="active",
                csrf_secret=csrf_token,
                issued_at=now,
                expires_at=now + timedelta(days=14),
                revoked_at=None,
                last_seen_at=now,
                ip_address="127.0.0.1",
                user_agent="pytest",
            )
        )

    return AuthenticatedWebSession(
        session_id=session_id,
        csrf_token=csrf_token,
        workspace_id=workspace_id,
        user_id=user_id,
    )


@pytest.fixture
def opportunity_payload_builder() -> Callable[..., dict[str, Any]]:
    def build(**overrides: Any) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "title": "Website redesign retainer",
            "company_name": "North Star Studio",
            "requested_service": "Website redesign and migration support",
            "source_type": "manual",
        }
        payload.update(overrides)
        return payload

    return build


@pytest.fixture
def opportunity_input_payload_builder() -> Callable[..., dict[str, Any]]:
    def build(**overrides: Any) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "input_type": "raw_input",
            "content": "Client needs a redesign, migration support, and analytics cleanup.",
            "source_label": "manual notes",
        }
        payload.update(overrides)
        return payload

    return build


@pytest.fixture
def file_upload_request_builder() -> Callable[..., dict[str, Any]]:
    def build(**overrides: Any) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "file_name": "north-star-intake.pdf",
            "mime_type": "application/pdf",
            "size_bytes": 524288,
        }
        payload.update(overrides)
        return payload

    return build
