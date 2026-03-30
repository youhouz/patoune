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
    return addSecurityHeaders(NextResponse.next());
  }

  // Check auth cookie for API routes — verify signed token
  if (pathname.startsWith("/api/")) {
    const authCookie = request.cookies.get("growth_agent_auth");
    if (!authCookie?.value || !verifyTokenFormat(authCookie.value)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

// Lightweight token format check (full crypto verification in lib/auth.ts)
function verifyTokenFormat(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [timestamp, nonce, signature] = parts;

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  const age = Date.now() - ts;
  if (age < 0 || age > 7 * 24 * 60 * 60 * 1000) return false;

  if (!/^[a-f0-9]{32}$/.test(nonce)) return false;
  if (!/^[a-f0-9]{64}$/.test(signature)) return false;

  return true;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.anthropic.com; frame-ancestors 'none';"
  );
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
