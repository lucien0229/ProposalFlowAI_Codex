from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from app.account_service import SessionRecord
from app.dashboard_service import build_dashboard_summary
from app.db import get_engine
from app.security import SessionContext, require_web_session

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _session_record(session: SessionContext) -> SessionRecord:
    return SessionRecord(
        session_id=session.session_id,
        user_id=session.user_id or "",
        csrf_secret="",
        workspace_id=session.workspace_id,
        session_type=session.session_type,
    )


@router.get("/summary", response_model=None)
def get_dashboard_summary_route(
    session: SessionContext = Depends(require_web_session),
) -> dict[str, Any]:
    with get_engine().begin() as connection:
        payload = build_dashboard_summary(connection, session=_session_record(session))
    return payload
