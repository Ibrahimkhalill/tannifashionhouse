import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CartSyncSchema, CartUpdateSchema, parseBody } from "@/lib/validators";

// GET /api/cart — returns the logged-in user's saved cart
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ items: [] });

  const items = await db.cartItem.findMany({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ items });
}

// POST /api/cart/sync — merge guest cart into DB on login
// Body: array of { productId, qty, size?, color? }
export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = parseBody(CartSyncSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const userId = session.user.id;

  // For each guest cart item: find existing DB item, bump qty or create
  for (const item of parsed.data) {
    const existing = await db.cartItem.findFirst({
      where: {
        userId,
        productId: item.productId,
        size:      item.size  ?? null,
        color:     item.color ?? null,
      },
    });

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data:  { qty: existing.qty + item.qty },
      });
    } else {
      await db.cartItem.create({
        data: {
          userId,
          productId: item.productId,
          qty:       item.qty,
          size:      item.size  ?? null,
          color:     item.color ?? null,
        },
      });
    }
  }

  const items = await db.cartItem.findMany({ where: { userId } });
  return NextResponse.json({ items });
}

// PATCH /api/cart — update a single item qty (0 = remove)
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = parseBody(CartUpdateSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { productId, qty, size, color } = parsed.data;
  const userId = session.user.id;

  const existing = await db.cartItem.findFirst({
    where: { userId, productId, size: size ?? null, color: color ?? null },
  });

  if (qty === 0) {
    if (existing) await db.cartItem.delete({ where: { id: existing.id } });
  } else if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { qty } });
  } else {
    await db.cartItem.create({
      data: { userId, productId, qty, size: size ?? null, color: color ?? null },
    });
  }

  const items = await db.cartItem.findMany({ where: { userId } });
  return NextResponse.json({ items });
}

// DELETE /api/cart — clear all cart items for logged-in user
export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });

  await db.cartItem.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
