import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Fixed-window rate limiting backed by Postgres (the RateLimit table), because
// Vercel's serverless instances don't share memory. One atomic upsert per check.
//
// Fails open: if the database call errors, the request is allowed — a limiter
// outage must never take the store down.

export type RateLimitResult = { ok: boolean; remaining: number; retryAfter: number };

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const windowEnd = new Date(Date.now() + windowMs);
  try {
    const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${windowEnd})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;
    const row = rows[0];

    // Occasionally sweep expired rows so the table stays small.
    if (Math.random() < 0.01) {
      db.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < NOW()`.catch(() => {});
    }

    const count = Number(row?.count ?? 1);
    const retryAfter = Math.max(1, Math.ceil(((row?.resetAt ?? windowEnd).getTime() - Date.now()) / 1000));
    return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfter };
  } catch (e) {
    console.error("[rate-limit] check failed, allowing request:", e);
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}

// Best-effort client IP. On Vercel, x-real-ip / x-forwarded-for are set by the
// platform edge, so they can't be spoofed by the client.
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

// Convenience for route handlers: returns a 429 response when the limit is hit,
// or null to continue.
export async function limitOrNull(key: string, limit: number, windowMs: number, message?: string) {
  const r = await rateLimit(key, limit, windowMs);
  if (r.ok) return null;
  const mins = Math.ceil(r.retryAfter / 60);
  return NextResponse.json(
    { error: message ?? `Too many requests — please try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
    { status: 429, headers: { "Retry-After": String(r.retryAfter) } },
  );
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
