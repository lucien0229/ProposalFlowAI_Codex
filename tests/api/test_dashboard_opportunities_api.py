from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import insert, update

from app.account_models import workspaces_table
from app.db import get_engine
from app.opportunity_models import opportunities_table


def test_create_opportunity(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_payload_builder,
) -> None:
    response = api_client.post(
        "/api/v1/opportunities",
        json=opportunity_payload_builder(),
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 201
    payload = response.json()

    assert payload["opportunity"]["title"] == "Website redesign retainer"
    assert payload["opportunity"]["company_name"] == "North Star Studio"
    assert payload["opportunity"]["status"] == "new"
    assert payload["opportunity"]["current_step"] == "overview"
    assert payload["redirect_to"].endswith("/overview")


def test_list_opportunities_with_filters(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_payload_builder,
) -> None:
    create_response = api_client.post(
        "/api/v1/opportunities",
        json=opportunity_payload_builder(
            title="North Star redesign",
            company_name="North Star Studio",
        ),
        headers=authenticated_web_session.write_header_map(),
    )
    assert create_response.status_code == 201

    response = api_client.get(
        "/api/v1/opportunities",
        params={
            "q": "North Star",
            "status": "new",
            "limit": 20,
            "order_by": "updated_at",
            "order_direction": "desc",
        },
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["items"]
    assert payload["items"][0]["title"] == "North Star redesign"
    assert payload["items"][0]["company_name"] == "North Star Studio"
    assert payload["next_cursor"] is None or isinstance(payload["next_cursor"], str)


def test_opportunity_detail_includes_current_step_and_restriction_fields(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_payload_builder,
) -> None:
    create_response = api_client.post(
        "/api/v1/opportunities",
        json=opportunity_payload_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    opportunity_id = create_response.json()["opportunity"]["id"]

    response = api_client.get(
        f"/api/v1/opportunities/{opportunity_id}",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["id"] == opportunity_id
    assert payload["current_step"] == "overview"
    assert payload["step_readiness"] in {"not_started", "ready", "blocked", "completed"}
    assert "restriction_reason" in payload


def test_archive_and_unarchive_opportunity(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_payload_builder,
) -> None:
    create_response = api_client.post(
        "/api/v1/opportunities",
        json=opportunity_payload_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    opportunity_id = create_response.json()["opportunity"]["id"]

    archive_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/archive",
        headers=authenticated_web_session.write_header_map(),
    )
    assert archive_response.status_code == 200
    archived_payload = archive_response.json()
    assert archived_payload["status"] == "archived"
    assert archived_payload["archived_at"] is not None

    unarchive_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/unarchive",
        headers=authenticated_web_session.write_header_map(),
    )
    assert unarchive_response.status_code == 200
    unarchived_payload = unarchive_response.json()
    assert unarchived_payload["status"] == "new"
    assert unarchived_payload["archived_at"] is None


def test_unarchive_restores_the_previous_workflow_status(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_payload_builder,
) -> None:
    create_response = api_client.post(
        "/api/v1/opportunities",
        json=opportunity_payload_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    opportunity_id = create_response.json()["opportunity"]["id"]

    with get_engine().begin() as connection:
        connection.execute(
            update(opportunities_table)
            .where(opportunities_table.c.id == opportunity_id)
            .values(status="proposal_ready")
        )

    archive_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/archive",
        headers=authenticated_web_session.write_header_map(),
    )
    assert archive_response.status_code == 200
    assert archive_response.json()["status"] == "archived"

    unarchive_response = api_client.post(
        f"/api/v1/opportunities/{opportunity_id}/unarchive",
        headers=authenticated_web_session.write_header_map(),
    )

    assert unarchive_response.status_code == 200
    unarchived_payload = unarchive_response.json()
    assert unarchived_payload["status"] == "proposal_ready"
    assert unarchived_payload["current_step"] == "proposal_draft"


def test_dashboard_summary(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_payload_builder,
) -> None:
    create_response = api_client.post(
        "/api/v1/opportunities",
        json=opportunity_payload_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    assert create_response.status_code == 201

    response = api_client.get(
        "/api/v1/dashboard/summary",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()

    assert "summary_counts" in payload
    assert "recent_opportunities" in payload
    assert "needs_attention" in payload
    assert "billing_snapshot" in payload
    assert payload["recent_opportunities"][0]["current_step_url"].endswith("/overview")


def test_dashboard_summary_counts_full_workspace_blockers_not_recent_sample(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    headers = authenticated_web_session.write_header_map()

    for index in range(101):
        response = api_client.post(
            "/api/v1/opportunities",
            json={
                "title": f"Blocked opportunity {index}",
                "company_name": f"North Star {index}",
                "requested_service": None,
            },
            headers=headers,
        )
        assert response.status_code == 201

    healthy_response = api_client.post(
        "/api/v1/opportunities",
        json={
            "title": "Healthy opportunity",
            "company_name": "Atlas Labs",
            "requested_service": "Migration plan",
        },
        headers=headers,
    )
    assert healthy_response.status_code == 201

    response = api_client.get(
        "/api/v1/dashboard/summary",
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary_counts"]["needs_attention"] == 101
    assert len(payload["needs_attention"]) == 5
    assert all(item["needs_attention_reason"] == "missing_input" for item in payload["needs_attention"])
    assert all(item["title"] != "Healthy opportunity" for item in payload["needs_attention"])


def test_create_opportunity_rejects_restricted_workspace(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_payload_builder,
) -> None:
    with get_engine().begin() as connection:
        connection.execute(
            update(workspaces_table)
            .where(workspaces_table.c.id == authenticated_web_session.workspace_id)
            .values(trial_status="trial_expired")
        )

    response = api_client.post(
        "/api/v1/opportunities",
        json=opportunity_payload_builder(),
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Workspace billing is restricted. Review billing to create new work."


def test_create_opportunity_validates_required_fields(
    api_client: TestClient,
    authenticated_web_session,
) -> None:
    response = api_client.post(
        "/api/v1/opportunities",
        json={"company_name": "North Star Studio"},
        headers=authenticated_web_session.write_header_map(),
    )

    assert response.status_code == 422


def test_list_opportunities_rejects_invalid_cursor(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_payload_builder,
) -> None:
    create_response = api_client.post(
        "/api/v1/opportunities",
        json=opportunity_payload_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    assert create_response.status_code == 201

    response = api_client.get(
        "/api/v1/opportunities",
        params={"cursor": "not-a-real-cursor"},
        headers=authenticated_web_session.read_header_map(),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid opportunity cursor."


def test_resume_target_uses_current_step_url(
    api_client: TestClient,
    authenticated_web_session,
    opportunity_payload_builder,
) -> None:
    create_response = api_client.post(
        "/api/v1/opportunities",
        json=opportunity_payload_builder(),
        headers=authenticated_web_session.write_header_map(),
    )
    assert create_response.status_code == 201

    detail_response = api_client.get(
        f"/api/v1/opportunities/{create_response.json()['opportunity']['id']}",
        headers=authenticated_web_session.read_header_map(),
    )

    assert detail_response.status_code == 200
    payload = detail_response.json()
    assert payload["current_step"] == "overview"
    assert payload["current_step_url"].endswith("/overview")
    assert payload["step_readiness"] == "not_started"
