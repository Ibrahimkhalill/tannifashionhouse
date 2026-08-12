import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountUpdateSchema, parseBody } from "@/lib/validators";

// GET /api/account — the signed-in user's profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user });
}

// PATCH /api/account — update name / email
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(AccountUpdateSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const email = parsed.data.email || null;

  // Guard against taking another account's email.
  if (email) {
    const clash = await db.user.findFirst({ where: { email, NOT: { id: session.user.id } } });
    if (clash) return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data:  { name: parsed.data.name, email },
    select: { id: true, name: true, phone: true, email: true, role: true },
  });

  return NextResponse.json({ user });
}
