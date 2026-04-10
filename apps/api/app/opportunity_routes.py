from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.account_service import SessionRecord, get_session_record
from app.db import get_engine
from app.opportunity_service import (
    OpportunityValidationError,
    create_opportunity,
    generate_lead_brief,
    get_opportunity_detail,
    list_opportunities,
    update_opportunity_overview,
)
from app.security import SessionContext, require_browser_csrf, require_web_session

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


class OpportunityFileGatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    file_status: str
    content: str | None = None


class OpportunityOverviewPatchPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1)
    company_name: str = Field(min_length=1)
    contact_name: str | None = None
    contact_email: str | None = None
    requested_service: str | None = None
    source_type: str | None = None
    raw_input: str | None = None
    file_gate: OpportunityFileGatePayload | None = None


class OpportunityCreatePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1)
    company_name: str = Field(min_length=1)
    requested_service: str | None = None
    source_type: str = "manual"


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


@router.get("", response_model=None)
def list_opportunities_route(
    q: str | None = Query(default=None),
    status: str | None = Query(default=None),
    archived: bool | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: str | None = Query(default=None),
    order_by: str = Query(default="updated_at"),
    order_direction: str = Query(default="desc"),
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    with get_engine().begin() as connection:
        loaded_session = get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if loaded_session is None:
            return JSONResponse(status_code=401, content={"detail": "Missing web session cookie"})
        payload = list_opportunities(
            connection,
            session=loaded_session,
            q=q,
            status=status,
            archived=archived,
            limit=limit,
            cursor=cursor,
            order_by=order_by,
            order_direction=order_direction,
        )
    return payload


@router.post("", response_model=None)
def create_opportunities_route(
    payload: OpportunityCreatePayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    with get_engine().begin() as connection:
        loaded_session = get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if loaded_session is None:
            return JSONResponse(status_code=401, content={"detail": "Missing web session cookie"})
        result = create_opportunity(
            connection,
            session=loaded_session,
            payload=payload.model_dump(exclude_none=False),
        )
    return JSONResponse(status_code=201, content=result)


@router.get("/{opportunity_id}", response_model=None)
def get_opportunity_overview(
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
        payload = get_opportunity_detail(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
        )
    if payload is None:
        return _not_found_response(opportunity_id)
    return payload


@router.patch("/{opportunity_id}", response_model=None)
def patch_opportunity_overview(
    opportunity_id: str,
    payload: OpportunityOverviewPatchPayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    try:
        with get_engine().begin() as connection:
            loaded_session = get_session_record(
                connection,
                session_id=session.session_id,
                session_type=session.session_type,
            )
            if loaded_session is None:
                return JSONResponse(status_code=401, content={"detail": "Missing web session cookie"})
            detail = update_opportunity_overview(
                connection,
                session=loaded_session,
                opportunity_id=opportunity_id,
                payload=payload.model_dump(exclude_none=False),
            )
    except OpportunityValidationError as error:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": str(error),
                    "details": {
                        "field": "contact_email",
                    },
                    "restriction_reason": None,
                }
            },
        )
    if detail is None:
        return _not_found_response(opportunity_id)
    return detail


@router.post("/{opportunity_id}/lead-brief/generate", response_model=None)
def post_generate_lead_brief(
    opportunity_id: str,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    with get_engine().begin() as connection:
        loaded_session = get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if loaded_session is None:
            return _not_found_response(opportunity_id)
        result = generate_lead_brief(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
        )
    if result is None:
        return _not_found_response(opportunity_id)
    payload, status_code = result
    if status_code >= 400:
        return JSONResponse(status_code=status_code, content=payload)
    return JSONResponse(status_code=status_code, content=payload)
