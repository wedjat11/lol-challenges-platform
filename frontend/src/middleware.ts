import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/app(.*)", "/onboarding(.*)"]);
const isAuthRoute = createRouteMatcher(["/auth/login", "/auth/register"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // Authenticated users visiting auth pages → redirect to app
  if (isAuthRoute(request) && userId) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  // Unauthenticated users visiting protected routes → redirect to sign-in
  if (isProtectedRoute(request) && !userId) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
