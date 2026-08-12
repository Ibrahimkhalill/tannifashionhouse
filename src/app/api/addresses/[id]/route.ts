import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressSchema, parseBody } from "@/lib/validators";

// PUT /api/addresses/:id — update an address (also used for "set default")
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { id } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = parseBody(AddressSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // Ownership check — never let a user edit someone else's address.
  const existing = await db.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = { ...parsed.data, line2: parsed.data.line2 || null };

  const address = await db.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
    }
    return tx.address.update({ where: { id }, data });
  });

  return NextResponse.json({ address });
}

// DELETE /api/addresses/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { id } = await params;
  const existing = await db.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
