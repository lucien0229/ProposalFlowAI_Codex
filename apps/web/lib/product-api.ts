import { getApiUrl } from "@/lib/auth-bootstrap";

export class ProductApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ProductApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ProductRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit | undefined;
  cookieHeader?: string | null | undefined;
  csrfToken?: string | null | undefined;
};

function resolveApiRequestUrl(path: string) {
  return typeof window === "undefined" ? getApiUrl(path) : path;
}

function readCookieValue(cookieSource: string, name: string) {
  const match = cookieSource
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function readErrorMessage(payload: unknown, status: number) {
  if (status >= 500) {
    return "The workspace service is unavailable right now.";
  }

  if (payload && typeof payload === "object") {
    if ("detail" in payload && typeof payload.detail === "string") {
      return payload.detail;
    }
    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }
  }

  if (status === 401) {
    return "Your session expired. Sign in again to continue.";
  }
  if (status === 403) {
    return "This action requires a fresh browser session.";
  }
  return "The workspace request could not be completed.";
}

async function parseJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export function readBrowserCsrfToken() {
  if (typeof document === "undefined") {
    return null;
  }
  return readCookieValue(document.cookie, "pf_csrf_token");
}

export async function requestProductJson<T>(
  path: string,
  {
    body,
    cookieHeader,
    csrfToken,
    headers: providedHeaders,
    method = "GET",
    ...init
  }: ProductRequestOptions = {},
) {
  const headers = new Headers(providedHeaders);

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const resolvedCsrfToken =
    csrfToken === undefined ? readBrowserCsrfToken() : csrfToken;

  if (body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (
    method !== "GET" &&
    method !== "HEAD" &&
    resolvedCsrfToken &&
    !headers.has("x-csrf-token")
  ) {
    headers.set("x-csrf-token", resolvedCsrfToken);
  }

  const requestInit: RequestInit = {
    ...init,
    method,
    headers,
    cache: init.cache ?? "no-store",
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  if (typeof window !== "undefined") {
    requestInit.credentials = "include";
  } else if (init.credentials) {
    requestInit.credentials = init.credentials;
  }

  const response = await fetch(resolveApiRequestUrl(path), requestInit);

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    throw new ProductApiError(readErrorMessage(payload, response.status), response.status, payload);
  }

  return payload as T;
}
