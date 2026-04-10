from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.account_models import workspace_members_table
from app.db import get_engine


def test_auth_and_setup_routes_validate_payloads(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    headers = authenticated_web_session.write_header_map()

    sign_up_response = api_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "owner@example.com",
            "password": "secret-123",
        },
    )
    assert sign_up_response.status_code == 422

    sign_in_response = api_client.post(
        "/api/v1/auth/sign-in",
        json={
            "email": "owner@example.com",
        },
    )
    assert sign_in_response.status_code == 422

    workspace_response = api_client.post(
        "/api/v1/workspaces",
        json={
            "workspace_name": "North Star Studio",
            "industry_type": "product_ux_agency",
        },
        headers=headers,
    )
    assert workspace_response.status_code == 422


def test_current_workspace_members_returns_404_without_workspace(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    with get_engine().begin() as connection:
        connection.execute(
            delete(workspace_members_table).where(
                workspace_members_table.c.workspace_id == authenticated_web_session.workspace_id,
            )
        )

    response = api_client.get("/api/v1/workspaces/current/members")

    assert response.status_code == 404
    assert response.json()["detail"] == "Workspace not found"
