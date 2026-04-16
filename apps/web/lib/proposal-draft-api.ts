import {
  API_ROUTE_PATHS,
  buildProposalDraftGenerateApiPath,
} from "@proposalflow/shared-config";
import type {
  ProposalDraftConflictResponse,
  ProposalDraftCurrentResourceResponse,
  ProposalDraftGenerateRequest,
  ProposalDraftGenerateResponse,
  ProposalDraftRestoreRequest,
  ProposalDraftSaveCurrentRequest,
  ProposalDraftSaveVersionRequest,
  ProposalDraftSectionKey,
  ProposalDraftSectionRegenerateRequest,
  ProposalDraftVersionDetailResponse,
  ProposalDraftVersionListResponse,
} from "@proposalflow/shared-types";

import { getApiUrl } from "@/lib/auth-bootstrap";
import { ProductApiError, requestProductJson } from "@/lib/product-api";

type ProposalDraftRequestOptions = {
  cookieHeader?: string | null;
  csrfToken?: string | null;
};

export function fetchProposalDraftWorkspace(
  opportunityId: string,
  options: ProposalDraftRequestOptions = {},
) {
  return requestProductJson<ProposalDraftCurrentResourceResponse>(
    API_ROUTE_PATHS.proposalDraft(opportunityId),
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function saveProposalDraftCurrent(
  opportunityId: string,
  body: ProposalDraftSaveCurrentRequest,
  options: ProposalDraftRequestOptions = {},
) {
  return requestProductJson<ProposalDraftCurrentResourceResponse>(
    API_ROUTE_PATHS.proposalDraft(opportunityId),
    {
      method: "PATCH",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function saveProposalDraftVersion(
  opportunityId: string,
  body: ProposalDraftSaveVersionRequest,
  options: ProposalDraftRequestOptions = {},
) {
  return requestProductJson<ProposalDraftCurrentResourceResponse>(
    API_ROUTE_PATHS.proposalDraftSaveVersion(opportunityId),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function listProposalDraftVersions(
  opportunityId: string,
  options: ProposalDraftRequestOptions = {},
) {
  return requestProductJson<ProposalDraftVersionListResponse>(
    API_ROUTE_PATHS.proposalDraftVersions(opportunityId),
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function fetchProposalDraftVersionDetail(
  opportunityId: string,
  versionNo: number,
  options: ProposalDraftRequestOptions = {},
) {
  return requestProductJson<ProposalDraftVersionDetailResponse>(
    API_ROUTE_PATHS.proposalDraftVersionDetail(opportunityId, versionNo),
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function restoreProposalDraftVersion(
  opportunityId: string,
  body: ProposalDraftRestoreRequest,
  options: ProposalDraftRequestOptions = {},
) {
  return requestProductJson<ProposalDraftCurrentResourceResponse>(
    API_ROUTE_PATHS.proposalDraftVersionRestore(opportunityId, body.version_no),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function generateProposalDraft(
  opportunityId: string,
  body: ProposalDraftGenerateRequest,
  options: ProposalDraftRequestOptions = {},
) {
  return requestProductJson<ProposalDraftGenerateResponse>(
    buildProposalDraftGenerateApiPath(opportunityId),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function regenerateProposalDraftSection(
  opportunityId: string,
  sectionKey: ProposalDraftSectionKey,
  body: ProposalDraftSectionRegenerateRequest,
  options: ProposalDraftRequestOptions = {},
) {
  return requestProductJson<ProposalDraftCurrentResourceResponse>(
    API_ROUTE_PATHS.proposalDraftSectionRegenerate(opportunityId, sectionKey),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export async function exportProposalDraft(
  opportunityId: string,
  format: "text" | "markdown",
  options: ProposalDraftRequestOptions = {},
) {
  const url = typeof window === "undefined"
    ? getApiUrl(`${API_ROUTE_PATHS.proposalDraftExport(opportunityId)}?format=${format}`)
    : `${API_ROUTE_PATHS.proposalDraftExport(opportunityId)}?format=${format}`;
  const requestInit: RequestInit = {
    method: "GET",
    cache: "no-store",
  };

  if (options.cookieHeader) {
    requestInit.headers = {
      cookie: options.cookieHeader,
    };
  }

  if (typeof window !== "undefined") {
    requestInit.credentials = "include";
  }

  const response = await fetch(url, requestInit);

  if (!response.ok) {
    let payload: unknown = null;
    const responseText = await response.text();
    if (responseText) {
      try {
        payload = JSON.parse(responseText) as unknown;
      } catch {
        payload = { raw: responseText };
      }
    }
    throw new ProductApiError("Proposal Draft export failed.", response.status, payload);
  }

  return response.text();
}

export type { ProposalDraftConflictResponse };
