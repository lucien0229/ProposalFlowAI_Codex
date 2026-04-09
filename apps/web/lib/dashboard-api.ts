import { API_ROUTE_PATHS } from "@proposalflow/shared-config";
import type {
  CreateOpportunityRequest,
  CreateOpportunityResponse,
  DashboardSummary,
} from "@proposalflow/shared-types";

import { requestProductJson } from "@/lib/product-api";

type DashboardRequestOptions = {
  cookieHeader?: string | null;
  csrfToken?: string | null;
};

export function fetchDashboardSummary(options: DashboardRequestOptions = {}) {
  return requestProductJson<DashboardSummary>(API_ROUTE_PATHS.dashboardSummary, {
    method: "GET",
    cookieHeader: options.cookieHeader,
  });
}

export function createDashboardOpportunity(
  payload: CreateOpportunityRequest,
  options: DashboardRequestOptions = {},
) {
  return requestProductJson<CreateOpportunityResponse>(API_ROUTE_PATHS.opportunities, {
    method: "POST",
    body: payload,
    cookieHeader: options.cookieHeader,
    csrfToken: options.csrfToken,
  });
}
