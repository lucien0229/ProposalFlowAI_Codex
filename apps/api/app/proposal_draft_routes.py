from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel, ConfigDict, Field

from app.account_service import get_session_record
from app.db import get_engine
from app.opportunity_repository import get_opportunity
from app.opportunity_service import get_workspace_snapshot, is_workspace_restricted
from app.proposal_draft_service import (
    ProposalDraftConflictError,
    ProposalDraftDependencyError,
    ProposalDraftNotFoundError,
    ProposalDraftSectionOverwriteRequiredError,
    ProposalDraftValidationError,
    ProposalDraftVersionNotFoundError,
    export_proposal_draft,
    generate_proposal_draft,
    get_proposal_draft_version_detail,
    get_proposal_draft_workspace,
    regenerate_proposal_draft_section,
    restore_proposal_draft_version,
    save_current_proposal_draft,
    save_version_proposal_draft,
)
from app.security import SessionContext, require_browser_csrf, require_web_session
from app.templates_rules_service import RuleValidationError

router = APIRouter(prefix="/opportunities", tags=["proposal-draft"])

BLOCKED_PROPOSAL_DRAFT_ACTIONS = [
    "generate",
    "regenerate",
    "save current",
    "save-version",
    "restore",
    "export",
]


class ProposalDraftSectionPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: Literal[
        "executive_summary",
        "objectives",
        "recommended_approach",
        "deliverables",
        "timeline",
        "assumptions",
        "exclusions",
        "next_steps",
    ]
    label: str
    content: str
    last_edited_at: str | None = None
    last_generated_at: str | None = None
    is_user_edited: bool
    confidence: Literal["low", "medium", "high"]
    warning: str | None = None


class ProposalDraftMutationPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_revision_no: int = Field(ge=0)
    sections: dict[str, ProposalDraftSectionPayload]


class ProposalDraftSaveVersionPayload(ProposalDraftMutationPayload):
    version_note: str | None = None


class ProposalDraftRestorePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_revision_no: int = Field(ge=0)
    version_no: int = Field(ge=1)


class ProposalDraftGeneratePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    template_key: str
    use_opportunity_overrides: bool
    force_low_confidence: bool


class ProposalDraftSectionRegeneratePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_revision_no: int = Field(ge=0)
    overwrite_current_edit: bool


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


def _conflict_response(error: ProposalDraftConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "error": {
                "code": "PROPOSAL_DRAFT_CONFLICT",
                "message": str(error),
                "details": {
                    "expected_revision_no": error.expected_revision_no,
                    "current_revision_no": error.current_revision_no,
                    "latest_version_no": error.latest_version_no,
                    "reload_hint": "Reload the latest proposal draft before saving again.",
                },
                "restriction_reason": None,
            }
        },
    )


def _dependency_response(error: ProposalDraftDependencyError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "error": {
                "code": error.code,
                "message": str(error),
                "details": {
                    "blocked_by": error.blocked_by,
                    "action_label": "Generate Draft",
                    "detail": error.detail,
                },
                "restriction_reason": None,
            }
        },
    )


def _overwrite_response(error: ProposalDraftSectionOverwriteRequiredError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "error": {
                "code": "PROPOSAL_DRAFT_SECTION_OVERWRITE_REQUIRED",
                "message": str(error),
                "details": {
                    "section_key": error.section_key,
                    "action_label": "Regenerate section",
                    "overwrite_warning": "Save Current first or confirm overwrite to replace this section.",
                    "requires_confirmation": True,
                },
                "restriction_reason": None,
            }
        },
    )


def _validation_response(
    *,
    message: str,
    opportunity_id: str,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message,
                "details": {
                    "opportunity_id": opportunity_id,
                },
                "restriction_reason": None,
            }
        },
    )


def _restriction_response(*, restriction_reason: str, action_label: str) -> JSONResponse:
    return JSONResponse(
        status_code=403,
        content={
            "error": {
                "code": "WORKSPACE_RESTRICTED",
                "message": "Proposal Draft action is blocked by workspace billing status.",
                "details": {
                    "action_label": action_label,
                    "blocked_actions": BLOCKED_PROPOSAL_DRAFT_ACTIONS,
                },
                "restriction_reason": restriction_reason,
            }
        },
    )


def _sections_payload(sections: dict[str, ProposalDraftSectionPayload]) -> dict[str, Any]:
    return {key: value.model_dump() for key, value in sections.items()}


def _load_workspace_context(session: SessionContext, *, opportunity_id: str) -> tuple[str, str | None, Any]:
    with get_engine().begin() as connection:
        loaded_session = get_session_record(
            connection,
            session_id=session.session_id,
            session_type=session.session_type,
        )
        if loaded_session is None:
            raise ProposalDraftNotFoundError("session")
        opportunity = get_opportunity(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
        )
        if opportunity is None:
            raise ProposalDraftNotFoundError("opportunity")
        workspace = get_workspace_snapshot(connection, loaded_session.workspace_id or "")
        return loaded_session.workspace_id or "", loaded_session.user_id, workspace


@router.get("/{opportunity_id}/proposal-draft", response_model=None)
def get_proposal_draft_route(
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
        payload = get_proposal_draft_workspace(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
            user_id=loaded_session.user_id,
        )
    return payload


@router.post("/{opportunity_id}/proposal-draft/generate", response_model=None)
def generate_proposal_draft_route(
    opportunity_id: str,
    payload: ProposalDraftGeneratePayload,
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
            workspace = get_workspace_snapshot(connection, loaded_session.workspace_id or "")
            restricted, restriction_reason = is_workspace_restricted(workspace)
            if restricted:
                return _restriction_response(
                    restriction_reason=restriction_reason or "workspace_missing",
                    action_label="Generate Draft",
                )
            result = generate_proposal_draft(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                template_key=payload.template_key,
                user_id=loaded_session.user_id,
                use_opportunity_overrides=payload.use_opportunity_overrides,
                force_low_confidence=payload.force_low_confidence,
            )
    except ProposalDraftDependencyError as error:
        return _dependency_response(error)
    except (ProposalDraftValidationError, RuleValidationError) as error:
        return _validation_response(message=str(error), opportunity_id=opportunity_id)
    return JSONResponse(status_code=202, content=result)


@router.patch("/{opportunity_id}/proposal-draft", response_model=None)
def patch_proposal_draft_route(
    opportunity_id: str,
    payload: ProposalDraftMutationPayload,
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
            workspace = get_workspace_snapshot(connection, loaded_session.workspace_id or "")
            restricted, restriction_reason = is_workspace_restricted(workspace)
            if restricted:
                return _restriction_response(
                    restriction_reason=restriction_reason or "workspace_missing",
                    action_label="Save Current",
                )
            result = save_current_proposal_draft(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                expected_revision_no=payload.expected_revision_no,
                sections=_sections_payload(payload.sections),
                user_id=loaded_session.user_id,
            )
    except ProposalDraftConflictError as error:
        return _conflict_response(error)
    except ProposalDraftNotFoundError:
        return _not_found_response(
            code="PROPOSAL_DRAFT_NOT_FOUND",
            message="Proposal Draft not found.",
            opportunity_id=opportunity_id,
        )
    except ProposalDraftValidationError as error:
        return _validation_response(message=str(error), opportunity_id=opportunity_id)
    return result


@router.post("/{opportunity_id}/proposal-draft/save-version", response_model=None)
def save_proposal_draft_version_route(
    opportunity_id: str,
    payload: ProposalDraftSaveVersionPayload,
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
            workspace = get_workspace_snapshot(connection, loaded_session.workspace_id or "")
            restricted, restriction_reason = is_workspace_restricted(workspace)
            if restricted:
                return _restriction_response(
                    restriction_reason=restriction_reason or "workspace_missing",
                    action_label="Save Version",
                )
            result = save_version_proposal_draft(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                expected_revision_no=payload.expected_revision_no,
                sections=_sections_payload(payload.sections),
                version_note=payload.version_note,
                user_id=loaded_session.user_id,
            )
    except ProposalDraftConflictError as error:
        return _conflict_response(error)
    except ProposalDraftNotFoundError:
        return _not_found_response(
            code="PROPOSAL_DRAFT_NOT_FOUND",
            message="Proposal Draft not found.",
            opportunity_id=opportunity_id,
        )
    except ProposalDraftValidationError as error:
        return _validation_response(message=str(error), opportunity_id=opportunity_id)
    return result


@router.get("/{opportunity_id}/proposal-draft/versions", response_model=None)
def list_proposal_draft_versions_route(
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
        payload = get_proposal_draft_workspace(
            connection,
            workspace_id=loaded_session.workspace_id or "",
            opportunity_id=opportunity_id,
            user_id=loaded_session.user_id,
        )
    return {"items": payload["versions"]}


@router.get("/{opportunity_id}/proposal-draft/versions/{version_no}", response_model=None)
def get_proposal_draft_version_route(
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
            payload = get_proposal_draft_version_detail(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                version_no=version_no,
                user_id=loaded_session.user_id,
            )
    except ProposalDraftVersionNotFoundError:
        return _not_found_response(
            code="PROPOSAL_DRAFT_VERSION_NOT_FOUND",
            message="Proposal Draft version not found.",
            opportunity_id=opportunity_id,
        )
    except ProposalDraftNotFoundError:
        return _not_found_response(
            code="PROPOSAL_DRAFT_NOT_FOUND",
            message="Proposal Draft not found.",
            opportunity_id=opportunity_id,
        )
    return payload


@router.post("/{opportunity_id}/proposal-draft/versions/{version_no}/restore", response_model=None)
def restore_proposal_draft_version_route(
    opportunity_id: str,
    version_no: int,
    payload: ProposalDraftRestorePayload,
    session: SessionContext = Depends(require_browser_csrf),
) -> JSONResponse | dict[str, Any]:
    if payload.version_no != version_no:
        return _validation_response(message="Version number mismatch.", opportunity_id=opportunity_id)
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
            workspace = get_workspace_snapshot(connection, loaded_session.workspace_id or "")
            restricted, restriction_reason = is_workspace_restricted(workspace)
            if restricted:
                return _restriction_response(
                    restriction_reason=restriction_reason or "workspace_missing",
                    action_label="Restore",
                )
            result = restore_proposal_draft_version(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                version_no=version_no,
                expected_revision_no=payload.expected_revision_no,
                user_id=loaded_session.user_id,
            )
    except ProposalDraftConflictError as error:
        return _conflict_response(error)
    except ProposalDraftVersionNotFoundError:
        return _not_found_response(
            code="PROPOSAL_DRAFT_VERSION_NOT_FOUND",
            message="Proposal Draft version not found.",
            opportunity_id=opportunity_id,
        )
    except ProposalDraftNotFoundError:
        return _not_found_response(
            code="PROPOSAL_DRAFT_NOT_FOUND",
            message="Proposal Draft not found.",
            opportunity_id=opportunity_id,
        )
    return result


@router.post("/{opportunity_id}/proposal-draft/sections/{section_key}/regenerate", response_model=None)
def regenerate_proposal_draft_section_route(
    opportunity_id: str,
    section_key: str,
    payload: ProposalDraftSectionRegeneratePayload,
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
            workspace = get_workspace_snapshot(connection, loaded_session.workspace_id or "")
            restricted, restriction_reason = is_workspace_restricted(workspace)
            if restricted:
                return _restriction_response(
                    restriction_reason=restriction_reason or "workspace_missing",
                    action_label="Regenerate section",
                )
            result = regenerate_proposal_draft_section(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                section_key=section_key,
                expected_revision_no=payload.expected_revision_no,
                overwrite_current_edit=payload.overwrite_current_edit,
                user_id=loaded_session.user_id,
            )
    except ProposalDraftConflictError as error:
        return _conflict_response(error)
    except ProposalDraftNotFoundError:
        return _not_found_response(
            code="PROPOSAL_DRAFT_NOT_FOUND",
            message="Proposal Draft not found.",
            opportunity_id=opportunity_id,
        )
    except ProposalDraftSectionOverwriteRequiredError as error:
        return _overwrite_response(error)
    except ProposalDraftValidationError as error:
        return _validation_response(message=str(error), opportunity_id=opportunity_id)
    return result


@router.get("/{opportunity_id}/proposal-draft/export", response_model=None)
def export_proposal_draft_route(
    opportunity_id: str,
    format: Literal["text", "markdown"] = Query(alias="format"),
    session: SessionContext = Depends(require_web_session),
) -> JSONResponse | PlainTextResponse:
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
            workspace = get_workspace_snapshot(connection, loaded_session.workspace_id or "")
            restricted, restriction_reason = is_workspace_restricted(workspace)
            if restricted:
                return _restriction_response(
                    restriction_reason=restriction_reason or "workspace_missing",
                    action_label="Export",
                )
            content = export_proposal_draft(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                user_id=loaded_session.user_id,
                export_format=format,
            )
    except ProposalDraftNotFoundError:
        return _not_found_response(
            code="PROPOSAL_DRAFT_NOT_FOUND",
            message="Proposal Draft not found.",
            opportunity_id=opportunity_id,
        )
    media_type = "text/markdown; charset=utf-8" if format == "markdown" else "text/plain; charset=utf-8"
    return PlainTextResponse(content, media_type=media_type)
