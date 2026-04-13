import { Client } from "pg";

import type { Page } from "@playwright/test";

const WEB_SESSION_COOKIE_NAME = "pf_web_session";

type WorkspaceBillingState = {
  trialStatus: string | null;
  billingStatus: string | null;
  planType: string | null;
};

export function resolveWorkspaceDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const databaseUrl = env.PROPOSALFLOW_TEST_DATABASE_URL ?? env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "Set PROPOSALFLOW_TEST_DATABASE_URL or DATABASE_URL before running workspace-backed Playwright helpers.",
    );
  }

  return databaseUrl.replace("postgresql+psycopg://", "postgresql://");
}

async function runQuery<T extends Record<string, string | null>>(text: string, values: unknown[] = []) {
  const client = new Client({ connectionString: resolveWorkspaceDatabaseUrl() });
  await client.connect();

  try {
    return await client.query<T>(text, values);
  } finally {
    await client.end();
  }
}

async function getCurrentSessionId(page: Page) {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === WEB_SESSION_COOKIE_NAME);
  if (!sessionCookie) {
    throw new Error("Expected an authenticated web session cookie.");
  }

  return sessionCookie.value;
}

export async function getWorkspaceIdForCurrentSession(page: Page) {
  const sessionId = await getCurrentSessionId(page);
  const result = await runQuery<{ workspace_id: string }>(
    [
      "select wm.workspace_id",
      "from user_sessions us",
      "join workspace_members wm on wm.user_id = us.user_id",
      "where us.id = $1 and wm.is_active = true",
      "limit 1;",
    ].join(" "),
    [sessionId],
  );

  const workspaceId = result.rows[0]?.workspace_id;
  if (!workspaceId) {
    throw new Error(`No workspace found for session ${sessionId}.`);
  }

  return workspaceId;
}

export async function readWorkspaceBillingState(workspaceId: string): Promise<WorkspaceBillingState> {
  const result = await runQuery<WorkspaceBillingState>(
    [
      "select",
      "coalesce(trial_status, '') as \"trialStatus\",",
      "coalesce(billing_status, '') as \"billingStatus\",",
      "coalesce(plan_type, '') as \"planType\"",
      "from workspaces",
      "where id = $1",
      "limit 1;",
    ].join(" "),
    [workspaceId],
  );

  const row = result.rows[0];
  return {
    trialStatus: row?.trialStatus || null,
    billingStatus: row?.billingStatus || null,
    planType: row?.planType || null,
  };
}

export async function updateWorkspaceBillingState(
  workspaceId: string,
  nextState: WorkspaceBillingState,
) {
  await runQuery(
    [
      "update workspaces",
      "set",
      "trial_status = $2,",
      "billing_status = $3,",
      "plan_type = $4,",
      "updated_at = CURRENT_TIMESTAMP",
      "where id = $1;",
    ].join(" "),
    [workspaceId, nextState.trialStatus, nextState.billingStatus, nextState.planType],
  );
}
