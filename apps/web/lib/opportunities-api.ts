import {
  API_ROUTE_PATHS,
  OPPORTUNITY_LIST_DEFAULT_LIMIT,
  OPPORTUNITY_LIST_QUERY_PARAM_NAMES,
} from "@proposalflow/shared-config";
import type {
  OpportunityListItem,
  OpportunitySortField,
  OpportunityStatus,
  SortDirection,
} from "@proposalflow/shared-types";

import { requestProductJson } from "@/lib/product-api";

export type OpportunityListQuery = {
  q?: string | undefined;
  status?: OpportunityStatus | "all" | undefined;
  archived?: boolean | undefined;
  limit?: number | undefined;
  cursor?: string | null | undefined;
  orderBy?: OpportunitySortField | undefined;
  orderDirection?: SortDirection | undefined;
};

export type OpportunityListResponse = {
  items: OpportunityListItem[];
  next_cursor: string | null;
};

type OpportunityRequestOptions = {
  cookieHeader?: string | null;
  csrfToken?: string | null;
};

function maybeSetSearchParam(searchParams: URLSearchParams, key: string, value: string | undefined) {
  if (value) {
    searchParams.set(key, value);
  }
}

export function buildOpportunityListSearchParams(query: OpportunityListQuery = {}) {
  const searchParams = new URLSearchParams();
  maybeSetSearchParam(searchParams, OPPORTUNITY_LIST_QUERY_PARAM_NAMES.q, query.q?.trim());

  if (query.status && query.status !== "all") {
    searchParams.set(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.status, query.status);
  }

  if (query.archived) {
    searchParams.set(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.archived, "true");
  }

  if (query.limit && query.limit !== OPPORTUNITY_LIST_DEFAULT_LIMIT) {
    searchParams.set(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.limit, String(query.limit));
  }

  if (query.cursor) {
    searchParams.set(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.cursor, query.cursor);
  }

  if (query.orderBy) {
    searchParams.set(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.orderBy, query.orderBy);
  }

  if (query.orderDirection) {
    searchParams.set(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.orderDirection, query.orderDirection);
  }

  return searchParams;
}

export function parseOpportunityListQuery(
  input:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | undefined,
): OpportunityListQuery {
  const searchParams =
    input instanceof URLSearchParams
      ? input
      : new URLSearchParams(
          Object.entries(input ?? {}).flatMap(([key, value]) => {
            if (Array.isArray(value)) {
              return value[0] ? [[key, value[0]]] : [];
            }
            return typeof value === "string" ? [[key, value]] : [];
          }),
        );

  const q = searchParams.get(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.q) ?? undefined;
  const status = searchParams.get(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.status) ?? undefined;
  const archived = searchParams.get(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.archived) === "true";
  const limit = Number(searchParams.get(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.limit) ?? OPPORTUNITY_LIST_DEFAULT_LIMIT);
  const cursor = searchParams.get(OPPORTUNITY_LIST_QUERY_PARAM_NAMES.cursor);
  const orderBy = (searchParams.get(
    OPPORTUNITY_LIST_QUERY_PARAM_NAMES.orderBy,
  ) ?? "updated_at") as OpportunitySortField;
  const orderDirection = (searchParams.get(
    OPPORTUNITY_LIST_QUERY_PARAM_NAMES.orderDirection,
  ) ?? "desc") as SortDirection;

  return {
    q,
    status: status ? (status as OpportunityStatus | "all") : "all",
    archived,
    limit,
    cursor,
    orderBy,
    orderDirection,
  };
}

export function isFilteredOpportunityQuery(query: OpportunityListQuery) {
  return Boolean(
    query.q ||
      (query.status && query.status !== "all") ||
      query.archived ||
      query.orderBy === "created_at" ||
      query.orderDirection === "asc",
  );
}

export function fetchOpportunities(
  query: OpportunityListQuery = {},
  options: OpportunityRequestOptions = {},
) {
  const searchParams = buildOpportunityListSearchParams({
    limit: OPPORTUNITY_LIST_DEFAULT_LIMIT,
    orderBy: "updated_at",
    orderDirection: "desc",
    status: "all",
    ...query,
  });
  const queryString = searchParams.toString();

  return requestProductJson<OpportunityListResponse>(
    queryString ? `${API_ROUTE_PATHS.opportunities}?${queryString}` : API_ROUTE_PATHS.opportunities,
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function fetchOpportunityDetail(
  opportunityId: string,
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<OpportunityListItem>(
    `${API_ROUTE_PATHS.opportunities}/${opportunityId}`,
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function updateOpportunityArchiveState(
  opportunityId: string,
  archived: boolean,
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<OpportunityListItem>(
    `${API_ROUTE_PATHS.opportunities}/${opportunityId}/${archived ? "archive" : "unarchive"}`,
    {
      method: "POST",
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function formatOpportunityTimestamp(value: string) {
  const timestamp = new Date(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}
