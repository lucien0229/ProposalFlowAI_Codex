from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.account_service import build_auth_bootstrap, create_workspace_for_user
from app.db import get_engine
from app.security import SessionContext, require_browser_csrf

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


class WorkspaceCreatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    workspace_name: str = Field(min_length=2)
    industry_type: str
    default_template_key: str
    default_tone_preference: str
    return_url: str | None = None


@router.post("", response_model=None)
def post_workspace(
    payload: WorkspaceCreatePayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    with get_engine().begin() as connection:
        bootstrap = build_auth_bootstrap(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if bootstrap is None:
            return JSONResponse(status_code=401, content={"detail": "Missing web session cookie"})

        try:
            result = create_workspace_for_user(
                connection,
                user_id=bootstrap["user"]["id"],
                name=payload.workspace_name,
                industry_type=payload.industry_type,
                default_template_key=payload.default_template_key,
                default_tone_preference=payload.default_tone_preference,
                return_url=payload.return_url,
            )
        except ValueError as error:
            return JSONResponse(status_code=409, content={"detail": str(error)})

    return JSONResponse(status_code=201, content={"redirect_to": result["redirect_to"]})
