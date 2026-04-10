import {
  API_ROUTE_PATHS,
  OPPORTUNITY_LIST_DEFAULT_LIMIT,
  OPPORTUNITY_LIST_QUERY_PARAM_NAMES,
} from "@proposalflow/shared-config";
import type {
  OpportunityCurrentStep,
  OpportunityFileProcessingJobStatus,
  OpportunityFileStatus,
  OpportunityGenerationGateReason,
  OpportunityInputType,
  OpportunityListItem,
  OpportunitySortField,
  OpportunityStatus,
  SortDirection,
  OpportunitySourceType,
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

export type OpportunityIntakeInput = {
  id: string;
  opportunity_id: string;
  input_type: OpportunityInputType;
  content: string;
  source_label: string | null;
  file_status: OpportunityFileStatus | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityFileProcessingJob = {
  id: string;
  file_asset_id: string;
  status: OpportunityFileProcessingJobStatus;
  attempt_number: number;
  error_message: string | null;
  queued_at: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export type OpportunityFileAsset = {
  id: string;
  opportunity_id: string;
  file_name: string;
  mime_type: string;
  storage_key: string;
  file_status: OpportunityFileStatus;
  latest_job_status: OpportunityFileProcessingJobStatus | null;
  uploaded_at: string | null;
  extracted_text: string | null;
  latest_job: OpportunityFileProcessingJob | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityIntakeGenerationGate = {
  can_generate: boolean;
  reason: OpportunityGenerationGateReason | null;
  detail: string;
};

export type OpportunityIntakeOverviewResponse = {
  opportunity: OpportunityListItem;
  workspace: {
    eyebrow: string;
    opportunity_id: string;
  };
  workflow: {
    current_step: {
      key: OpportunityCurrentStep;
      label: string;
    };
    steps: string[];
    step_readiness: "not_started" | "ready" | "blocked" | "completed";
    restriction_context: {
      is_restricted: boolean;
      restriction_reason: string | null;
    };
  };
  minimum_context: {
    owner: {
      user_id: string | null;
      name: string | null;
    };
    fields: {
      title: string;
      company_name: string;
      contact_name: string | null;
      contact_email: string | null;
      requested_service: string | null;
      source_type: OpportunitySourceType | null;
    };
  };
  intake: {
    primary_input: OpportunityIntakeInput | null;
    latest_file: OpportunityFileAsset | null;
    generation_gate: OpportunityIntakeGenerationGate;
  };
  save_state: {
    status: "saved" | "saving" | "failed";
    label: string;
  };
};

export type OpportunityIntakeListResponse = {
  items: OpportunityIntakeInput[];
  primary_input_id: string | null;
  allowed_input_types: OpportunityInputType[];
};

export type OpportunityFileUploadResponse = {
  file: OpportunityFileAsset;
  upload: {
    method: "PUT";
    upload_url: string;
    object_key: string;
  };
};

export type OpportunityFileDetailResponse = {
  file: OpportunityFileAsset;
  latest_job: OpportunityFileProcessingJob | null;
  next_action_label: string | null;
};

export type LeadBriefGenerateResponse = {
  status: "queued";
  redirect_to: string;
  lead_brief: {
    opportunity_id: string;
    generation_started_at: string;
  };
  gate: OpportunityIntakeGenerationGate;
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

export function fetchOpportunityIntakeDetail(
  opportunityId: string,
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<OpportunityIntakeOverviewResponse>(
    `${API_ROUTE_PATHS.opportunities}/${opportunityId}`,
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function updateOpportunityIntake(
  opportunityId: string,
  body: {
    title: string;
    company_name: string;
    contact_name: string | null;
    contact_email: string | null;
    requested_service: string | null;
    source_type: OpportunitySourceType | null;
    raw_input: string | null;
    file_gate?: {
      file_status: OpportunityFileStatus;
      content?: string | null;
    } | null;
  },
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<OpportunityIntakeOverviewResponse>(
    `${API_ROUTE_PATHS.opportunities}/${opportunityId}`,
    {
      method: "PATCH",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function listOpportunityInputs(
  opportunityId: string,
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<OpportunityIntakeListResponse>(
    API_ROUTE_PATHS.opportunityInputs(opportunityId),
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function createOpportunityInput(
  opportunityId: string,
  body: {
    input_type: OpportunityInputType;
    content: string;
    source_label?: string | null;
  },
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<{ input: OpportunityIntakeInput }>(
    API_ROUTE_PATHS.opportunityInputs(opportunityId),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function updateOpportunityInput(
  opportunityId: string,
  inputId: string,
  body: {
    content?: string | null;
    source_label?: string | null;
  },
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<{ input: OpportunityIntakeInput }>(
    API_ROUTE_PATHS.opportunityInputDetail(opportunityId, inputId),
    {
      method: "PATCH",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function createOpportunityFileUploadUrl(
  opportunityId: string,
  body: {
    file_name: string;
    mime_type: string;
    size_bytes: number;
  },
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<OpportunityFileUploadResponse>(
    API_ROUTE_PATHS.opportunityFileUploadUrl(opportunityId),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function completeOpportunityFileUpload(
  opportunityId: string,
  fileAssetId: string,
  body: {
    object_key: string;
    simulate_failure?: boolean;
  },
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<OpportunityFileDetailResponse & { poll_url: string }>(
    API_ROUTE_PATHS.opportunityFileComplete(opportunityId, fileAssetId),
    {
      method: "POST",
      body,
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function fetchOpportunityFileDetail(
  opportunityId: string,
  fileAssetId: string,
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<OpportunityFileDetailResponse>(
    API_ROUTE_PATHS.opportunityFileDetail(opportunityId, fileAssetId),
    {
      method: "GET",
      cookieHeader: options.cookieHeader,
    },
  );
}

export function retryOpportunityFileProcessing(
  opportunityId: string,
  fileAssetId: string,
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<OpportunityFileDetailResponse & { poll_url: string }>(
    API_ROUTE_PATHS.opportunityFileRetry(opportunityId, fileAssetId),
    {
      method: "POST",
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
    },
  );
}

export function generateLeadBrief(
  opportunityId: string,
  options: OpportunityRequestOptions = {},
) {
  return requestProductJson<LeadBriefGenerateResponse>(
    API_ROUTE_PATHS.leadBriefGenerate(opportunityId),
    {
      method: "POST",
      cookieHeader: options.cookieHeader,
      csrfToken: options.csrfToken,
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
