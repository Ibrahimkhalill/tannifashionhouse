import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressSchema, parseBody } from "@/lib/validators";

// GET /api/addresses — list the signed-in user's saved addresses
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return NextResponse.json({ addresses });
}

// POST /api/addresses — add a new address
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(AddressSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const data = { ...parsed.data, line2: parsed.data.line2 || null, userId: session.user.id };

  // If this is set as default, clear the default flag on the user's other addresses.
  const address = await db.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
    }
    return tx.address.create({ data });
  });

  return NextResponse.json({ address }, { status: 201 });
}
