from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.account_service import SessionRecord, get_session_record
from app.db import get_engine
from app.opportunity_service import create_input, list_inputs, update_input
from app.security import SessionContext, require_browser_csrf, require_web_session

router = APIRouter(prefix="/opportunities", tags=["opportunity-inputs"])


class OpportunityInputCreatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    input_type: str
    content: str = Field(min_length=1)
    source_label: str | None = None


class OpportunityInputPatchPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str | None = None
    source_label: str | None = None


def _session_record(session: SessionContext) -> SessionRecord:
    return SessionRecord(
        session_id=session.session_id,
        user_id=session.user_id,
        csrf_secret="",
        workspace_id=session.workspace_id,
        session_type=session.session_type,
    )


def _not_found_response(opportunity_id: str) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            "error": {
                "code": "OPPORTUNITY_NOT_FOUND",
                "message": "Opportunity not found.",
                "details": {
                    "opportunity_id": opportunity_id,
                },
                "restriction_reason": None,
            }
        },
    )


@router.get("/{opportunity_id}/inputs", response_model=None)
def get_inputs(
    opportunity_id: str,
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    with get_engine().begin() as connection:
        loaded_session = get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if loaded_session is None:
            return _not_found_response(opportunity_id)
        payload = list_inputs(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
        )
    if payload is None:
        return _not_found_response(opportunity_id)
    return payload


@router.post("/{opportunity_id}/inputs", response_model=None)
def post_input(
    opportunity_id: str,
    payload: OpportunityInputCreatePayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse:
    with get_engine().begin() as connection:
        loaded_session = get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if loaded_session is None:
            return _not_found_response(opportunity_id)
        created = create_input(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
            payload=payload.model_dump(exclude_none=False),
        )
    if created is None:
        return _not_found_response(opportunity_id)
    return JSONResponse(status_code=201, content=created)


@router.patch("/{opportunity_id}/inputs/{input_id}", response_model=None)
def patch_input(
    opportunity_id: str,
    input_id: str,
    payload: OpportunityInputPatchPayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse:
    with get_engine().begin() as connection:
        loaded_session = get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if loaded_session is None:
            return _not_found_response(opportunity_id)
        updated = update_input(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
            input_id=input_id,
            payload=payload.model_dump(exclude_unset=True),
        )
    if updated is None:
        return _not_found_response(opportunity_id)
    return JSONResponse(status_code=200, content=updated)
