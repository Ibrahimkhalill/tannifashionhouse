import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

type GuardResult =
  | { session: Session; error: null }
  | { session: null; error: Response };

// Call this at the top of every admin API handler.
// Returns { session, error: null } to proceed, or { session: null, error } to return.
export async function requireAdmin(): Promise<GuardResult> {
  const session = await auth();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }
  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
