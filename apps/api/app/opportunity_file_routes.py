from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.account_service import SessionRecord, get_session_record
from app.db import get_engine
from app.file_processing_runtime import resolve_object_store
from app.opportunity_service import (
    complete_file_upload,
    create_file_upload_url,
    get_file_detail,
    process_file_upload,
    retry_file_processing,
)
from app.security import SessionContext, require_browser_csrf, require_web_session

router = APIRouter(prefix="/opportunities", tags=["opportunity-files"])


class OpportunityFileUploadPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    file_name: str = Field(min_length=1)
    mime_type: str = Field(min_length=1)
    size_bytes: int = Field(gt=0)


class OpportunityFileCompletePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    object_key: str = Field(min_length=1)
    simulate_failure: bool = False


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


def _resolve_object_store(request: Request):
    object_store = getattr(request.app.state, "object_store", None)
    if object_store is None:
        object_store = resolve_object_store()
        request.app.state.object_store = object_store
    return object_store


@router.post("/{opportunity_id}/files/upload-url", response_model=None)
def post_file_upload_url(
    opportunity_id: str,
    payload: OpportunityFileUploadPayload,
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
        created = create_file_upload_url(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
            payload=payload.model_dump(),
        )
    if created is None:
        return _not_found_response(opportunity_id)
    return JSONResponse(status_code=201, content=created)


@router.put("/{opportunity_id}/files/{file_asset_id}/upload", response_model=None)
async def put_file_upload(
    opportunity_id: str,
    file_asset_id: str,
    request: Request,
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

        file_asset = get_file_detail(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
            file_asset_id=file_asset_id,
        )
        if file_asset is None:
            return _not_found_response(opportunity_id)

        object_store = _resolve_object_store(request)
        object_store.put_bytes(file_asset["file"]["storage_key"], await request.body())

    return JSONResponse(status_code=200, content={"stored": True})


@router.post("/{opportunity_id}/files/{file_asset_id}/complete", response_model=None)
def post_complete_file_upload(
    opportunity_id: str,
    file_asset_id: str,
    request: Request,
    payload: OpportunityFileCompletePayload,
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
        completed = complete_file_upload(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
            file_asset_id=file_asset_id,
            payload=payload.model_dump(),
        )
        if completed is not None and request.app.state is not None:
            object_store = _resolve_object_store(request)
            processed = process_file_upload(
                connection,
                workspace_id=loaded_session.workspace_id or "",
                opportunity_id=opportunity_id,
                file_asset_id=file_asset_id,
                object_store=object_store,
            )
            if processed is not None:
                completed = processed
    if completed is None:
        return _not_found_response(opportunity_id)
    return JSONResponse(status_code=202, content=completed)


@router.get("/{opportunity_id}/files/{file_asset_id}", response_model=None)
def get_file_upload(
    opportunity_id: str,
    file_asset_id: str,
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
        payload = get_file_detail(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
            file_asset_id=file_asset_id,
        )
    if payload is None:
        return _not_found_response(opportunity_id)
    return payload


@router.post("/{opportunity_id}/files/{file_asset_id}/retry", response_model=None)
def post_retry_file_upload(
    opportunity_id: str,
    file_asset_id: str,
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
        payload = retry_file_processing(
            connection,
            session=loaded_session,
            opportunity_id=opportunity_id,
            file_asset_id=file_asset_id,
        )
    if payload is None:
        return _not_found_response(opportunity_id)
    return JSONResponse(status_code=202, content=payload)
