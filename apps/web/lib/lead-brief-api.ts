import {
  API_ROUTE_PATHS,
  buildLeadBriefGenerateApiPath,
} from "@proposalflow/shared-config";
import type {
  LeadBriefConflictResponse,
  LeadBriefCurrentResourceResponse,
  LeadBriefGenerateResponse,
  LeadBriefRestoreRequest,
  LeadBriefSaveCurrentRequest,
  LeadBriefSaveVersionRequest,
  LeadBriefVersionDetailResponse,
  LeadBriefVersionListResponse,
} from "@proposalflow/shared-types";

import { requestProductJson } from "@/lib/product-api";

type LeadBriefRequestOptions = {
  cookieHeader?: string | null;
  csrfToken?: string | null;
};

export function fetchLeadBriefWorkspace(
  opportunityId: string,
  options: LeadBriefRequestOptions = {},
) {
  return requestProductJson<LeadBriefCurrentResourceResponse>(
    API_ROUTE_PATHS.leadBrief(opportunityId),
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function saveLeadBriefCurrent(
  opportunityId: string,
  body: LeadBriefSaveCurrentRequest,
  options: LeadBriefRequestOptions = {},
) {
  return requestProductJson<LeadBriefCurrentResourceResponse>(
    API_ROUTE_PATHS.leadBrief(opportunityId),
    {
      method: "PATCH",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function saveLeadBriefVersion(
  opportunityId: string,
  body: LeadBriefSaveVersionRequest,
  options: LeadBriefRequestOptions = {},
) {
  return requestProductJson<LeadBriefCurrentResourceResponse>(
    API_ROUTE_PATHS.leadBriefSaveVersion(opportunityId),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function listLeadBriefVersions(
  opportunityId: string,
  options: LeadBriefRequestOptions = {},
) {
  return requestProductJson<LeadBriefVersionListResponse>(
    API_ROUTE_PATHS.leadBriefVersions(opportunityId),
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function fetchLeadBriefVersionDetail(
  opportunityId: string,
  versionNo: number,
  options: LeadBriefRequestOptions = {},
) {
  return requestProductJson<LeadBriefVersionDetailResponse>(
    API_ROUTE_PATHS.leadBriefVersionDetail(opportunityId, versionNo),
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function restoreLeadBriefVersion(
  opportunityId: string,
  body: LeadBriefRestoreRequest,
  options: LeadBriefRequestOptions = {},
) {
  return requestProductJson<LeadBriefCurrentResourceResponse>(
    API_ROUTE_PATHS.leadBriefVersionRestore(opportunityId, body.version_no),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function generateLeadBrief(
  opportunityId: string,
  options: LeadBriefRequestOptions = {},
) {
  return requestProductJson<LeadBriefGenerateResponse>(buildLeadBriefGenerateApiPath(opportunityId), {
    method: "POST",
    cookieHeader: options.cookieHeader,
    csrfToken: options.csrfToken,
  });
}

export const regenerateLeadBrief = generateLeadBrief;

export type { LeadBriefConflictResponse };
