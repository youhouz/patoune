import { NextRequest, NextResponse } from "next/server";
import {
  getClientIP, isRateLimited, recordFailedAttempt,
  clearFailedAttempts, generateAuthToken, secureCompare,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request.headers);

    // Check rate limit
    const { limited, retryAfter } = isRateLimited(ip);
    if (limited) {
      return NextResponse.json(
        { error: `Trop de tentatives. Reessaye dans ${retryAfter}s` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Validate content-type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type invalide" }, { status: 400 });
    }

    // Limit body size (1KB max for auth)
    const body = await request.text();
    if (body.length > 1024) {
      return NextResponse.json({ error: "Requete trop grande" }, { status: 413 });
    }

    let parsed: { password?: unknown };
    try {
      parsed = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { password } = parsed;
    if (typeof password !== "string" || password.length === 0 || password.length > 128) {
      return NextResponse.json({ error: "Mot de passe invalide" }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
    }

    if (!secureCompare(password, adminPassword)) {
      recordFailedAttempt(ip);
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    // Success
    clearFailedAttempts(ip);
    const token = generateAuthToken();

    const response = NextResponse.json({ success: true });
    response.cookies.set("growth_agent_auth", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("growth_agent_auth");
  return response;
}
