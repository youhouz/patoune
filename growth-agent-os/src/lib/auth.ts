import crypto from "crypto";

// Rate limiting: track failed attempts per IP
const failedAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minute window

export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export function isRateLimited(ip: string): { limited: boolean; retryAfter?: number } {
  const record = failedAttempts.get(ip);
  if (!record) return { limited: false };

  const now = Date.now();

  if (record.lockedUntil > now) {
    return { limited: true, retryAfter: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  if (now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
    failedAttempts.delete(ip);
    return { limited: false };
  }

  return { limited: false };
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = failedAttempts.get(ip) || { count: 0, lastAttempt: now, lockedUntil: 0 };
  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_DURATION_MS;
    record.count = 0;
  }

  failedAttempts.set(ip, record);
}

export function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "growth-agent-os-2024";
}

export function generateAuthToken(): string {
  const secret = getSecret();
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${timestamp}:${nonce}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return `${payload}:${signature}`;
}

export function verifyAuthToken(token: string): boolean {
  const secret = getSecret();
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [timestamp, nonce, signature] = parts;
  const payload = `${timestamp}:${nonce}`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Timing-safe comparison
  if (signature.length !== expected.length) return false;
  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  } catch {
    return false;
  }

  // Check token age (max 7 days)
  const tokenAge = Date.now() - parseInt(timestamp, 10);
  if (isNaN(tokenAge) || tokenAge < 0 || tokenAge > 7 * 24 * 60 * 60 * 1000) return false;

  return true;
}

export function secureCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}
