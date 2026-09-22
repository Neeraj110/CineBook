import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/account",
  "/booking",
  "/bookings",
  "/confirmation",
  "/payments",
  "/admin",
];

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get("token")?.value);
  const pathname = request.nextUrl.pathname;
  const requiresSession = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (requiresSession && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "redirect",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/booking/:path*",
    "/bookings/:path*",
    "/confirmation/:path*",
    "/payments/:path*",
    "/admin/:path*",
  ],
};
