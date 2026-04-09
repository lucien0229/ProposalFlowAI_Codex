import { execFileSync } from "node:child_process";

import type { Page } from "@playwright/test";

const WEB_SESSION_COOKIE_NAME = "pf_web_session";
const DEFAULT_DATABASE_PATH = process.env.PROPOSALFLOW_DB_PATH ?? "/tmp/proposalflow-phase3.db";

type WorkspaceBillingState = {
  trialStatus: string | null;
  billingStatus: string | null;
  planType: string | null;
};

function escapeSql(value: string) {
  return value.replaceAll("'", "''");
}

function runSql(sql: string) {
  return execFileSync("sqlite3", ["-noheader", DEFAULT_DATABASE_PATH, sql], {
    encoding: "utf8",
  }).trim();
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
  const workspaceId = runSql(
    [
      "select wm.workspace_id",
      "from user_sessions us",
      "join workspace_members wm on wm.user_id = us.user_id",
      `where us.id = '${escapeSql(sessionId)}' and wm.is_active = 1`,
      "limit 1;",
    ].join(" "),
  );

  if (!workspaceId) {
    throw new Error(`No workspace found for session ${sessionId}.`);
  }

  return workspaceId;
}

export function readWorkspaceBillingState(workspaceId: string): WorkspaceBillingState {
  const result = runSql(
    [
      "select",
      "coalesce(trial_status, ''),",
      "coalesce(billing_status, ''),",
      "coalesce(plan_type, '')",
      "from workspaces",
      `where id = '${escapeSql(workspaceId)}'`,
      "limit 1;",
    ].join(" "),
  );

  const [trialStatus = "", billingStatus = "", planType = ""] = result.split("|");
  return {
    trialStatus: trialStatus || null,
    billingStatus: billingStatus || null,
    planType: planType || null,
  };
}

export function updateWorkspaceBillingState(workspaceId: string, nextState: WorkspaceBillingState) {
  runSql(
    [
      "update workspaces",
      "set",
      `trial_status = ${nextState.trialStatus ? `'${escapeSql(nextState.trialStatus)}'` : "null"},`,
      `billing_status = ${nextState.billingStatus ? `'${escapeSql(nextState.billingStatus)}'` : "null"},`,
      `plan_type = ${nextState.planType ? `'${escapeSql(nextState.planType)}'` : "null"},`,
      "updated_at = CURRENT_TIMESTAMP",
      `where id = '${escapeSql(workspaceId)}';`,
    ].join(" "),
  );
}
