import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth API and static files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/api/health"
  ) {
    return NextResponse.next();
  }

  // Check auth cookie for API routes
  if (pathname.startsWith("/api/")) {
    const authCookie = request.cookies.get("growth_agent_auth");
    if (!authCookie || authCookie.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
