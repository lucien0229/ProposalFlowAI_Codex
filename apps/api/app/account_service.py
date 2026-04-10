from __future__ import annotations

import base64
import hashlib
import os
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlencode

from sqlalchemy import and_, insert, select, update
from sqlalchemy.engine import Connection, RowMapping

from app.account_models import (
    user_sessions_table,
    users_table,
    workspace_members_table,
    workspaces_table,
)

BUSINESS_ROUTE_DEFAULT = "/dashboard"
SETUP_ROUTE = "/setup/workspace"
WEB_SESSION_COOKIE = "pf_web_session"
CSRF_COOKIE = "pf_csrf_token"


@dataclass(frozen=True)
class SessionRecord:
    session_id: str
    session_type: str
    user_id: str
    csrf_secret: str
    workspace_id: str | None


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_urlsafe(12)}"


def _is_safe_return_url(value: str | None) -> bool:
    return bool(value) and value.startswith("/") and not value.startswith("//")


def _build_setup_redirect(return_url: str | None) -> str:
    if not _is_safe_return_url(return_url):
        return SETUP_ROUTE
    return f"{SETUP_ROUTE}?{urlencode({'return_url': return_url})}"


def _build_business_redirect(return_url: str | None) -> str:
    if _is_safe_return_url(return_url):
        return return_url or BUSINESS_ROUTE_DEFAULT
    return BUSINESS_ROUTE_DEFAULT


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return f"{base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def _verify_password(password: str, encoded: str) -> bool:
    salt_b64, digest_b64 = encoded.split("$", maxsplit=1)
    salt = base64.b64decode(salt_b64.encode())
    expected = base64.b64decode(digest_b64.encode())
    actual = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return secrets.compare_digest(actual, expected)


def _serialize_workspace(row: RowMapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "industry_type": row["industry_type"],
        "default_template_key": row["default_template_key"],
        "default_tone_preference": row["default_tone_preference"],
        "trial_status": row["trial_status"],
        "billing_status": row["billing_status"],
        "plan_type": row["plan_type"],
        "current_period_end": row["current_period_end"].isoformat() if row["current_period_end"] else None,
    }


def get_workspace_for_user(connection: Connection, user_id: str) -> RowMapping[str, Any] | None:
    result = connection.execute(
        select(workspaces_table)
        .select_from(
            workspace_members_table.join(
                workspaces_table,
                workspace_members_table.c.workspace_id == workspaces_table.c.id,
            )
        )
        .where(
            and_(
                workspace_members_table.c.user_id == user_id,
                workspace_members_table.c.is_active.is_(True),
            )
        )
        .limit(1)
    )
    return result.mappings().first()


def get_session_record(
    connection: Connection,
    *,
    session_id: str,
    session_type: str,
) -> SessionRecord | None:
    result = connection.execute(
        select(
            user_sessions_table.c.id,
            user_sessions_table.c.session_type,
            user_sessions_table.c.user_id,
            user_sessions_table.c.csrf_secret,
        ).where(
            and_(
                user_sessions_table.c.id == session_id,
                user_sessions_table.c.session_type == session_type,
                user_sessions_table.c.session_status == "active",
                user_sessions_table.c.revoked_at.is_(None),
                user_sessions_table.c.expires_at > _utc_now(),
            )
        )
    ).mappings().first()
    if result is None:
        return None

    workspace = get_workspace_for_user(connection, result["user_id"])
    connection.execute(
        update(user_sessions_table)
        .where(user_sessions_table.c.id == session_id)
        .values(last_seen_at=_utc_now())
    )
    return SessionRecord(
        session_id=result["id"],
        session_type=result["session_type"],
        user_id=result["user_id"],
        csrf_secret=result["csrf_secret"],
        workspace_id=None if workspace is None else workspace["id"],
    )


def sign_up_user(
    connection: Connection,
    *,
    email: str,
    full_name: str,
    password: str,
    return_url: str | None,
    session_type: str,
    ip_address: str | None,
    user_agent: str | None,
) -> dict[str, Any]:
    existing_user = connection.execute(
        select(users_table.c.id).where(users_table.c.email == email)
    ).scalar_one_or_none()
    if existing_user is not None:
        raise ValueError("An account with this email already exists.")

    now = _utc_now()
    user_id = _new_id("user")
    connection.execute(
        insert(users_table).values(
            id=user_id,
            email=email,
            full_name=full_name,
            password_hash=_hash_password(password),
            primary_auth_provider="password",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
    )
    session_payload = create_session(
        connection,
        user_id=user_id,
        session_type=session_type,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return {
        **session_payload,
        "redirect_to": _build_setup_redirect(return_url),
    }


def sign_in_user(
    connection: Connection,
    *,
    email: str,
    password: str,
    return_url: str | None,
    session_type: str,
    ip_address: str | None,
    user_agent: str | None,
) -> dict[str, Any]:
    user = connection.execute(
        select(users_table).where(users_table.c.email == email)
    ).mappings().first()
    if user is None or not _verify_password(password, user["password_hash"]):
        raise PermissionError("Invalid email or password.")

    session_payload = create_session(
        connection,
        user_id=user["id"],
        session_type=session_type,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    workspace = get_workspace_for_user(connection, user["id"])
    redirect_to = _build_setup_redirect(return_url) if workspace is None else _build_business_redirect(return_url)
    return {
        **session_payload,
        "redirect_to": redirect_to,
    }


def create_google_session(
    connection: Connection,
    *,
    return_url: str | None,
    session_type: str,
    ip_address: str | None,
    user_agent: str | None,
) -> dict[str, Any]:
    email = "google-user@example.com"
    user = connection.execute(
        select(users_table).where(users_table.c.email == email)
    ).mappings().first()
    if user is None:
        now = _utc_now()
        user_id = _new_id("user")
        connection.execute(
            insert(users_table).values(
                id=user_id,
                email=email,
                full_name="Google User",
                password_hash=_hash_password(secrets.token_urlsafe(16)),
                primary_auth_provider="google",
                is_active=True,
                created_at=now,
                updated_at=now,
            )
        )
        user = connection.execute(
            select(users_table).where(users_table.c.id == user_id)
        ).mappings().one()

    session_payload = create_session(
        connection,
        user_id=user["id"],
        session_type=session_type,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    workspace = get_workspace_for_user(connection, user["id"])
    redirect_to = _build_setup_redirect(return_url) if workspace is None else _build_business_redirect(return_url)
    return {
        **session_payload,
        "redirect_to": redirect_to,
    }


def create_session(
    connection: Connection,
    *,
    user_id: str,
    session_type: str,
    ip_address: str | None,
    user_agent: str | None,
) -> dict[str, Any]:
    now = _utc_now()
    session_id = _new_id("session")
    csrf_secret = secrets.token_urlsafe(24)
    connection.execute(
        insert(user_sessions_table).values(
            id=session_id,
            user_id=user_id,
            session_type=session_type,
            session_status="active",
            csrf_secret=csrf_secret,
            issued_at=now,
            expires_at=now + timedelta(days=30),
            revoked_at=None,
            last_seen_at=now,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )
    return {
        "session_id": session_id,
        "csrf_secret": csrf_secret,
    }


def revoke_session(connection: Connection, session_id: str) -> None:
    connection.execute(
        update(user_sessions_table)
        .where(user_sessions_table.c.id == session_id)
        .values(
            session_status="revoked",
            revoked_at=_utc_now(),
        )
    )


def build_auth_bootstrap(
    connection: Connection,
    *,
    session_id: str,
    session_type: str,
) -> dict[str, Any] | None:
    session = get_session_record(connection, session_id=session_id, session_type=session_type)
    if session is None:
        return None

    user = connection.execute(
        select(users_table).where(users_table.c.id == session.user_id)
    ).mappings().one()
    workspace = get_workspace_for_user(connection, session.user_id)
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "primary_auth_provider": user["primary_auth_provider"],
            "is_active": user["is_active"],
        },
        "workspace": _serialize_workspace(workspace),
        "workspace_setup_required": workspace is None,
        "session_type": session.session_type,
    }


def create_workspace_for_user(
    connection: Connection,
    *,
    user_id: str,
    name: str,
    industry_type: str,
    default_template_key: str,
    default_tone_preference: str,
    return_url: str | None,
) -> dict[str, Any]:
    existing_workspace = get_workspace_for_user(connection, user_id)
    if existing_workspace is not None:
        raise ValueError("Workspace already exists for this account.")

    now = _utc_now()
    workspace_id = _new_id("workspace")
    trial_end = now + timedelta(days=14)
    connection.execute(
        insert(workspaces_table).values(
            id=workspace_id,
            name=name,
            industry_type=industry_type,
            default_template_key=default_template_key,
            default_tone_preference=default_tone_preference,
            trial_status="trial_active",
            trial_start_at=now,
            trial_end_at=trial_end,
            billing_status="active",
            plan_type="trial",
            stripe_customer_id=None,
            stripe_subscription_id=None,
            current_period_end=trial_end,
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
    return {
        "workspace_id": workspace_id,
        "redirect_to": _build_business_redirect(return_url),
    }
