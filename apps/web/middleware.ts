import { NextRequest, NextResponse } from "next/server";

import { BUSINESS_ROUTE_PATHS, RETURN_URL_QUERY_PARAM, SETUP_ROUTE_PATHS } from "@proposalflow/shared-config";
import {
  fetchAuthBootstrap,
  isBusinessReturnUrl,
  isSafeReturnUrl,
  resolvePostAuthTarget,
} from "@/lib/auth-bootstrap";

function buildReturnTarget(request: NextRequest): string | null {
  const returnUrl = request.nextUrl.searchParams.get(RETURN_URL_QUERY_PARAM);
  if (isSafeReturnUrl(returnUrl) && isBusinessReturnUrl(returnUrl)) {
    return returnUrl;
  }
  return request.nextUrl.pathname;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const bootstrap = await fetchAuthBootstrap(cookieHeader);

  if (!bootstrap) {
    if (pathname.startsWith("/auth")) {
      return NextResponse.next();
    }
    if (pathname === SETUP_ROUTE_PATHS.workspace) {
      return NextResponse.redirect(new URL(`/auth/sign-in`, request.url));
    }
    const signInUrl = new URL(`/auth/sign-in`, request.url);
    const returnTarget = buildReturnTarget(request);
    if (returnTarget) {
      signInUrl.searchParams.set(RETURN_URL_QUERY_PARAM, returnTarget);
    }
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL(resolvePostAuthTarget(bootstrap, request.nextUrl.searchParams.get(RETURN_URL_QUERY_PARAM)), request.url));
  }

  if (pathname === SETUP_ROUTE_PATHS.workspace) {
    if (bootstrap.workspace_setup_required) {
      return NextResponse.next();
    }
    return NextResponse.redirect(
      new URL(resolvePostAuthTarget(bootstrap, request.nextUrl.searchParams.get(RETURN_URL_QUERY_PARAM)), request.url),
    );
  }

  if (pathname === BUSINESS_ROUTE_PATHS.dashboard || pathname.startsWith("/opportunities")) {
    if (bootstrap.workspace_setup_required) {
      const setupUrl = new URL(SETUP_ROUTE_PATHS.workspace, request.url);
      const returnUrl = request.nextUrl.searchParams.get(RETURN_URL_QUERY_PARAM);
      if (isSafeReturnUrl(returnUrl) && isBusinessReturnUrl(returnUrl)) {
        setupUrl.searchParams.set(RETURN_URL_QUERY_PARAM, returnUrl);
      } else {
        setupUrl.searchParams.set(RETURN_URL_QUERY_PARAM, pathname);
      }
      return NextResponse.redirect(setupUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
