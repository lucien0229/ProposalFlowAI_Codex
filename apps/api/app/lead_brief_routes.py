from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from app.account_service import SessionRecord, get_session_record
from app.db import get_engine
from app.lead_brief_service import (
    LeadBriefConflictError,
    LeadBriefNotFoundError,
    LeadBriefVersionNotFoundError,
    get_lead_brief_version_detail,
    get_lead_brief_workspace,
    restore_lead_brief_version,
    save_current_lead_brief,
    save_version_lead_brief,
)
from app.opportunity_repository import get_opportunity
from app.security import SessionContext, require_browser_csrf, require_web_session

router = APIRouter(prefix="/opportunities", tags=["lead-brief"])


class LeadBriefFieldValuePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: str | None = None
    state: Literal["confirmed", "inferred", "missing", "needs_review"]
    source_excerpt: str | None = None


class LeadBriefFieldsMutationPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_revision_no: int = Field(ge=0)
    fields: dict[str, LeadBriefFieldValuePayload]


class LeadBriefRestorePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_revision_no: int = Field(ge=0)
    version_no: int = Field(ge=1)


def _session_record(session: SessionContext) -> SessionRecord:
    return SessionRecord(
        session_id=session.session_id,
        user_id=session.user_id,
        csrf_secret="",
        workspace_id=session.workspace_id,
        session_type=session.session_type,
    )


def _not_found_response(
    *,
    code: str,
    message: str,
    opportunity_id: str,
    status_code: int = 404,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": {
                    "opportunity_id": opportunity_id,
                },
                "restriction_reason": None,
            }
        },
    )


def _conflict_response(error: LeadBriefConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "error": {
                "code": "LEAD_BRIEF_CONFLICT",
                "message": str(error),
                "details": {
                    "current_revision_no": error.current_revision_no,
                    "expected_revision_no": error.expected_revision_no,
                    "latest_version_no": error.latest_version_no,
                    "message": str(error),
                    "reload_hint": "Reload the latest lead brief before saving or restoring.",
                },
                "restriction_reason": None,
            }
        },
    )


@router.get("/{opportunity_id}/lead-brief", response_model=None)
def get_lead_brief_route(
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
            return _not_found_response(
                code="OPPORTUNITY_NOT_FOUND",
                message="Opportunity not found.",
                opportunity_id=opportunity_id,
            )
        opportunity = get_opportunity(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
        )
        if opportunity is None:
            return _not_found_response(
                code="OPPORTUNITY_NOT_FOUND",
                message="Opportunity not found.",
                opportunity_id=opportunity_id,
            )
        payload = get_lead_brief_workspace(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
        )
    return payload


@router.patch("/{opportunity_id}/lead-brief", response_model=None)
def patch_lead_brief_route(
    opportunity_id: str,
    payload: LeadBriefFieldsMutationPayload,
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
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            result = save_current_lead_brief(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                expected_revision_no=payload.expected_revision_no,
                fields={name: value.model_dump() for name, value in payload.fields.items()},
                user_id=loaded_session.user_id,
            )
    except LeadBriefConflictError as error:
        return _conflict_response(error)
    except LeadBriefNotFoundError:
        return _not_found_response(
            code="LEAD_BRIEF_NOT_FOUND",
            message="Lead brief not found.",
            opportunity_id=opportunity_id,
        )
    return result


@router.post("/{opportunity_id}/lead-brief/save-version", response_model=None)
def save_lead_brief_version_route(
    opportunity_id: str,
    payload: LeadBriefFieldsMutationPayload,
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
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            result = save_version_lead_brief(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                expected_revision_no=payload.expected_revision_no,
                fields={name: value.model_dump() for name, value in payload.fields.items()},
                user_id=loaded_session.user_id,
            )
    except LeadBriefConflictError as error:
        return _conflict_response(error)
    except LeadBriefNotFoundError:
        return _not_found_response(
            code="LEAD_BRIEF_NOT_FOUND",
            message="Lead brief not found.",
            opportunity_id=opportunity_id,
        )
    return result


@router.get("/{opportunity_id}/lead-brief/versions", response_model=None)
def list_lead_brief_versions_route(
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
            return _not_found_response(
                code="OPPORTUNITY_NOT_FOUND",
                message="Opportunity not found.",
                opportunity_id=opportunity_id,
            )
        opportunity = get_opportunity(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
        )
        if opportunity is None:
            return _not_found_response(
                code="OPPORTUNITY_NOT_FOUND",
                message="Opportunity not found.",
                opportunity_id=opportunity_id,
            )
        payload = get_lead_brief_workspace(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
        )
    return {"items": payload["versions"]}


@router.get("/{opportunity_id}/lead-brief/versions/{version_no}", response_model=None)
def get_lead_brief_version_route(
    opportunity_id: str,
    version_no: int,
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | dict[str, Any]:
    try:
        with get_engine().begin() as connection:
            loaded_session = get_session_record(
                connection,
                session_id=session.session_id,
                session_type=session.session_type,
            )
            if loaded_session is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            payload = get_lead_brief_version_detail(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                version_no=version_no,
            )
    except LeadBriefVersionNotFoundError:
        return _not_found_response(
            code="LEAD_BRIEF_VERSION_NOT_FOUND",
            message="Lead brief version not found.",
            opportunity_id=opportunity_id,
        )
    return payload


@router.post("/{opportunity_id}/lead-brief/versions/{version_no}/restore", response_model=None)
def restore_lead_brief_version_route(
    opportunity_id: str,
    version_no: int,
    payload: LeadBriefRestorePayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    if payload.version_no != version_no:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Version number mismatch.",
                    "details": {
                        "opportunity_id": opportunity_id,
                        "version_no": version_no,
                    },
                    "restriction_reason": None,
                }
            },
        )

    try:
        with get_engine().begin() as connection:
            loaded_session = get_session_record(
                connection,
                session_id=session.session_id,
                session_type=session.session_type,
            )
            if loaded_session is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            opportunity = get_opportunity(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
            )
            if opportunity is None:
                return _not_found_response(
                    code="OPPORTUNITY_NOT_FOUND",
                    message="Opportunity not found.",
                    opportunity_id=opportunity_id,
                )
            result = restore_lead_brief_version(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                version_no=version_no,
                expected_revision_no=payload.expected_revision_no,
                user_id=loaded_session.user_id,
            )
    except LeadBriefConflictError as error:
        return _conflict_response(error)
    except LeadBriefNotFoundError:
        return _not_found_response(
            code="LEAD_BRIEF_NOT_FOUND",
            message="Lead brief not found.",
            opportunity_id=opportunity_id,
        )
    except LeadBriefVersionNotFoundError:
        return _not_found_response(
            code="LEAD_BRIEF_VERSION_NOT_FOUND",
            message="Lead brief version not found.",
            opportunity_id=opportunity_id,
        )
    return result
