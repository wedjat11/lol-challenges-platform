import { NextRequest, NextResponse } from "next/server";

// The backend sets this httpOnly cookie on login/register/refresh.
// The access token is stored in memory (never in a cookie), so the
// middleware must use the refresh cookie as the auth signal.
const REFRESH_COOKIE = "lol_refresh";

const protectedRoutes = ["/app", "/onboarding"];
const authRoutes = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // The httpOnly lol_refresh cookie is present whenever the user has a
  // valid session (set by the backend on login / refresh).
  const hasSession = Boolean(
    request.cookies.get(REFRESH_COOKIE)?.value,
  );

  // Public routes — always allow
  if (path === "/" || path.startsWith("/api")) {
    return NextResponse.next();
  }

  // Auth routes — if session exists, skip to app
  if (authRoutes.some((route) => path.startsWith(route))) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — require a session cookie
  if (protectedRoutes.some((route) => path.startsWith(route))) {
    if (!hasSession) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
