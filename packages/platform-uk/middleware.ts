import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import {
  isAllowedDashboardPath,
  resolveOnboardingEntryPath,
  resolvePostAuthRedirect,
} from "@/lib/auth/redirects";
import { nextAuthSecret } from "@/lib/auth-secret";
import type { UserRole } from "@/lib/onboarding/roles";

const publicRoutePrefixes = [
  "/",
  "/signin",
  "/signup",
  "/auth/error",
  "/api/auth",
  "/demo",
  "/get-started",
  "/api/access-requests",
  "/platform",
  "/for-clinicians",
  "/for-practices",
  "/for-hospitals",
  "/for-patients",
  "/for-administrators",
  "/docs",
  "/security",
  "/integrations",
  "/about",
  "/contact",
  "/privacy",
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

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

function isAuthEntryPath(pathname: string) {
  return pathname === "/signin" || pathname === "/signup" || pathname === "/auth/signin";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: nextAuthSecret,
  });

  const isAuthenticated = Boolean(token?.id);
  const role = (token?.role as UserRole | undefined) ?? null;
  const onboardingComplete = Boolean(token?.onboardingComplete);

  if (pathname === "/auth/signin") {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.search = request.nextUrl.search;
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthEntryPath(pathname) && isAuthenticated) {
    const destination = resolvePostAuthRedirect({
      onboardingComplete,
      role,
      callbackUrl: request.nextUrl.searchParams.get("callbackUrl"),
    });
    return NextResponse.redirect(new URL(destination, request.url));
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
      new URL(resolvePostAuthRedirect({ onboardingComplete: true, role }), request.url)
    );
  }

  if (isAuthenticated && pathname.startsWith("/dashboard") && !onboardingComplete) {
    return NextResponse.redirect(new URL(resolveOnboardingEntryPath(role), request.url));
  }

  if (isAuthenticated && pathname.startsWith("/dashboard") && onboardingComplete && role) {
    if (!isAllowedDashboardPath(pathname, role)) {
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
