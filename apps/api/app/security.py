from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from fastapi import Depends, HTTPException, Request, status

from app.account_service import get_session_record
from app.db import get_engine

SessionType = Literal["web", "admin"]

WEB_SESSION_COOKIE = "pf_web_session"
ADMIN_SESSION_COOKIE = "pf_admin_session"
CSRF_COOKIE = "pf_csrf_token"
CSRF_HEADER = "x-csrf-token"


@dataclass(frozen=True)
class SessionContext:
    session_type: SessionType
    session_id: str
    workspace_id: str | None = None
    user_id: str | None = None


def get_session_context(request: Request, session_type: SessionType) -> SessionContext:
    cookie_name = WEB_SESSION_COOKIE if session_type == "web" else ADMIN_SESSION_COOKIE
    session_id = request.cookies.get(cookie_name)
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Missing {session_type} session cookie",
        )

    with get_engine().begin() as connection:
        session = get_session_record(
            connection,
            session_id=session_id,
            session_type=session_type,
        )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid {session_type} session",
        )

    return SessionContext(
        session_type=session_type,
        session_id=session.session_id,
        workspace_id=session.workspace_id,
        user_id=session.user_id,
    )


def require_web_session(request: Request) -> SessionContext:
    return get_session_context(request, "web")


def require_admin_session(request: Request) -> SessionContext:
    return get_session_context(request, "admin")


def require_browser_csrf(
    request: Request,
    session: SessionContext = Depends(require_web_session),
) -> SessionContext:
    header_token = request.headers.get(CSRF_HEADER)
    cookie_token = request.cookies.get(CSRF_COOKIE)
    if not header_token or header_token != cookie_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Browser write requests require a matching CSRF token",
        )
    return session
