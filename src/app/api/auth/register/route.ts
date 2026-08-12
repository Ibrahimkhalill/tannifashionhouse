import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { RegisterSchema, parseBody } from "@/lib/validators";

// POST /api/auth/register
// Body: { name, phone, email?, password }
// Signs the user up. No login happens here — they log in separately.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = parseBody(RegisterSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { name, phone, email, password } = parsed.data;

  // Check for duplicate phone or email
  const existing = await db.user.findFirst({
    where: {
      OR: [
        { phone },
        ...(email ? [{ email }] : []),
      ],
    },
  });
  if (existing) {
    const field = existing.phone === phone ? "Phone number" : "Email";
    return NextResponse.json({ error: `${field} is already registered` }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      phone,
      email:    email || null,
      password: hashed,
      role:     "CUSTOMER",
    },
    select: { id: true, name: true, phone: true, email: true, role: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
