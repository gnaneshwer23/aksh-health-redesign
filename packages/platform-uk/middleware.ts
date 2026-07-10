import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { nextAuthSecret } from "@/lib/auth-secret";

const publicRoutes = ["/", "/auth/signin", "/auth/error", "/api/auth"];
const protectedRoutes = ["/cases", "/review", "/intake", "/workspace"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route is public
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = protectedRoutes.some(
    (route) => pathname.startsWith(route)
  );

  if (isProtected) {
    const token = await getToken({
      req: request,
      secret: nextAuthSecret,
    });

    if (!token) {
      const loginUrl = new URL("/auth/signin", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Attach userId to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", token.id as string);
    requestHeaders.set("x-user-email", token.email as string);
    requestHeaders.set("x-user-role", token.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next/static|_next/image|favicon.ico).*)",
  ],
};
