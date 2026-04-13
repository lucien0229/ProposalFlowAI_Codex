import {
  API_ROUTE_PATHS,
  buildDiscoveryGenerateApiPath,
} from "@proposalflow/shared-config";
import type {
  DiscoveryConflictResponse,
  DiscoveryCurrentResourceResponse,
  DiscoveryGenerateResponse,
  DiscoveryRestoreRequest,
  DiscoverySaveCurrentRequest,
  DiscoverySaveVersionRequest,
  DiscoverySourceNotesRequest,
  DiscoveryVersionDetailResponse,
  DiscoveryVersionListResponse,
} from "@proposalflow/shared-types";

import { requestProductJson } from "@/lib/product-api";

type DiscoveryRequestOptions = {
  cookieHeader?: string | null;
  csrfToken?: string | null;
};

export function fetchDiscoveryWorkspace(
  opportunityId: string,
  options: DiscoveryRequestOptions = {},
) {
  return requestProductJson<DiscoveryCurrentResourceResponse>(API_ROUTE_PATHS.discovery(opportunityId), {
    method: "GET",
    cookieHeader: options.cookieHeader,
  });
}

export function saveDiscoveryCurrent(
  opportunityId: string,
  body: DiscoverySaveCurrentRequest,
  options: DiscoveryRequestOptions = {},
) {
  return requestProductJson<DiscoveryCurrentResourceResponse>(API_ROUTE_PATHS.discovery(opportunityId), {
    method: "PATCH",
    body,
    cookieHeader: options.cookieHeader,
    csrfToken: options.csrfToken,
  });
}

export function saveDiscoveryVersion(
  opportunityId: string,
  body: DiscoverySaveVersionRequest,
  options: DiscoveryRequestOptions = {},
) {
  return requestProductJson<DiscoveryCurrentResourceResponse>(API_ROUTE_PATHS.discoverySaveVersion(opportunityId), {
    method: "POST",
    body,
    cookieHeader: options.cookieHeader,
    csrfToken: options.csrfToken,
  });
}

export function listDiscoveryVersions(
  opportunityId: string,
  options: DiscoveryRequestOptions = {},
) {
  return requestProductJson<DiscoveryVersionListResponse>(API_ROUTE_PATHS.discoveryVersions(opportunityId), {
    method: "GET",
    cookieHeader: options.cookieHeader,
  });
}

export function fetchDiscoveryVersionDetail(
  opportunityId: string,
  versionNo: number,
  options: DiscoveryRequestOptions = {},
) {
  return requestProductJson<DiscoveryVersionDetailResponse>(
    API_ROUTE_PATHS.discoveryVersionDetail(opportunityId, versionNo),
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function restoreDiscoveryVersion(
  opportunityId: string,
  body: DiscoveryRestoreRequest,
  options: DiscoveryRequestOptions = {},
) {
  return requestProductJson<DiscoveryCurrentResourceResponse>(
    API_ROUTE_PATHS.discoveryVersionRestore(opportunityId, body.version_no),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function generateDiscovery(
  opportunityId: string,
  body: DiscoverySourceNotesRequest,
  options: DiscoveryRequestOptions = {},
) {
  return requestProductJson<DiscoveryGenerateResponse>(buildDiscoveryGenerateApiPath(opportunityId), {
    method: "POST",
    body,
    cookieHeader: options.cookieHeader,
    csrfToken: options.csrfToken,
  });
}

export const regenerateDiscovery = generateDiscovery;

export type { DiscoveryConflictResponse };
