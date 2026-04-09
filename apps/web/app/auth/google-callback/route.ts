import { NextResponse } from "next/server";

import { API_ROUTE_PATHS } from "@proposalflow/shared-config";
import { getApiUrl } from "@/lib/auth-bootstrap";

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const upstreamUrl = getApiUrl(`${API_ROUTE_PATHS.auth}/google/callback${incoming.search}`);
  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      "user-agent": request.headers.get("user-agent") ?? "",
    },
    redirect: "manual",
    cache: "no-store",
  });

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location") ?? "/auth/sign-in";
    const response = NextResponse.redirect(new URL(location, request.url), upstream.status as 301 | 302 | 303 | 307 | 308);
    const setCookies =
      typeof (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
        ? (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie()
        : upstream.headers.get("set-cookie")
          ? [upstream.headers.get("set-cookie") as string]
          : [];
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  }

  return NextResponse.redirect(new URL("/auth/sign-in", request.url));
}
