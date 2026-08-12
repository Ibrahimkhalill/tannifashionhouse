import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Edge-safe auth instance: only reads/validates the JWT — no providers, no
// db/bcrypt. Avoids "edge runtime does not support crypto" from the full config.
const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth?: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;

  // ── Admin protection ──────────────────────────────────────────────────────
  // Every /admin/* route (except login) requires an authenticated ADMIN session.
  // API routes guard themselves via requireAdmin()/auth(), so they're not matched.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = req.auth;
    if (!session || session.user?.role !== "ADMIN") {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  // Only guard admin pages at the edge. API routes do their own auth checks.
  matcher: ["/admin/:path*"],
};
