import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import {
  isAllowedDashboardPath,
  resolveOnboardingEntryPath,
  resolvePostAuthRedirect,
} from "@/lib/auth/redirects";
import { nextAuthSecret } from "@/lib/auth-secret";
import { isClosedInRealWorkspace, isPublicDemoPath, isRealWorkspace, realHomeFor, realWorkspaceRedirect, TRACK_B_NOT_OPEN } from "@/lib/env/workspace";
import { isProofEnvironment, proofRedirect } from "@/lib/env/proof";
import type { UserRole } from "@/lib/onboarding/roles";

const publicRoutePrefixes = [
  "/",
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/error",
  "/api/auth",
  "/demo",
  "/proof",
  "/get-started",
  "/api/access-requests",
  "/platform",
  "/security",
  "/about",
  "/contact",
  "/privacy",
  "/cookies",
  "/terms",
  "/careers",
];

const sessionRequiredPrefixes = [
  "/dashboard",
  "/onboarding",
  "/cases",
  "/review",
  "/intake",
  "/workspace",
];

const publicDemoDashboardPrefixes = ["/dashboard/gp", "/dashboard/ics", "/dashboard/hospital", "/dashboard/front-desk", "/dashboard/network"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

function isAuthEntryPath(pathname: string) {
  return (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/auth/signin"
  );
}

export async function middleware(request: NextRequest) {
  if (!isProofEnvironment()) return route(request);
  // Clinical-proof environment: its own landing page, nothing that invites real details, never indexed.
  const target = proofRedirect(request.nextUrl.pathname);
  const response = target ? NextResponse.redirect(new URL(target, request.url)) : await route(request);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

async function route(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: nextAuthSecret,
  });

  const isAuthenticated = Boolean(token?.id);
  const role = (token?.role as UserRole | undefined) ?? null;
  const onboardingComplete = Boolean(token?.onboardingComplete);

  if (pathname === "/auth/signin" || pathname === "/login") {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.search = request.nextUrl.search;
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthEntryPath(pathname) && isAuthenticated) {
    let destination = resolvePostAuthRedirect({
      onboardingComplete,
      role,
      callbackUrl: request.nextUrl.searchParams.get("callbackUrl"),
    });
    if (isRealWorkspace() && onboardingComplete) destination = realWorkspaceRedirect(destination, role) ?? destination;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const real = isRealWorkspace();

  if (real && isPublicDemoPath(pathname)) return NextResponse.redirect(new URL("/", request.url));
  if (real && isClosedInRealWorkspace(pathname)) return NextResponse.json({ error: TRACK_B_NOT_OPEN }, { status: 403 });

  if (!isAuthEntryPath(pathname) && real && isAuthenticated && onboardingComplete) {
    const target = realWorkspaceRedirect(pathname, role);
    if (target && target !== pathname) return NextResponse.redirect(new URL(target, request.url));
  }

  // The real workspace has no signed-out demo dashboards.
  const isPublicDemoDashboard =
    !real && !isAuthenticated && matchesPrefix(pathname, publicDemoDashboardPrefixes);

  if (isPublicDemoDashboard) {
    return NextResponse.next();
  }

  const requiresSession = matchesPrefix(pathname, sessionRequiredPrefixes);
  const isPublic = matchesPrefix(pathname, publicRoutePrefixes) && !requiresSession;

  if (isPublic) {
    return NextResponse.next();
  }

  if (requiresSession && !isAuthenticated) {
    const loginUrl = new URL("/signin", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname.startsWith("/onboarding") && onboardingComplete) {
    return NextResponse.redirect(
      new URL(real ? realHomeFor(role) : resolvePostAuthRedirect({ onboardingComplete: true, role }), request.url)
    );
  }

  if (isAuthenticated && pathname.startsWith("/dashboard") && !onboardingComplete) {
    return NextResponse.redirect(new URL(resolveOnboardingEntryPath(role), request.url));
  }

  if (isAuthenticated && pathname.startsWith("/dashboard") && onboardingComplete && role) {
    if (!real && !isAllowedDashboardPath(pathname, role)) {
      return NextResponse.redirect(
        new URL(resolvePostAuthRedirect({ onboardingComplete: true, role }), request.url)
      );
    }
  }

  if (requiresSession && isAuthenticated) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", token!.id as string);
    requestHeaders.set("x-user-email", (token!.email as string) ?? "");
    requestHeaders.set("x-user-role", (token!.role as string) ?? "");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next/static|_next/image|favicon.ico).*)"],
};
