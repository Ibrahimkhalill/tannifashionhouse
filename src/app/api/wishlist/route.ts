import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/wishlist — the signed-in user's saved product ids (+ product data)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const rows = await db.wishlist.findMany({
    where: { userId: session.user.id },
    orderBy: { id: "desc" },
  });
  const productIds = rows.map((r) => r.productId);

  // Wishlist.productId stores the storefront id (slug); resolve to live products.
  const products = productIds.length
    ? await db.product.findMany({
        where: { OR: [{ slug: { in: productIds } }, { id: { in: productIds } }], status: "ACTIVE" },
        select: { id: true, slug: true, name: true, price: true, oldPrice: true, images: true,
                  colors: true, sizes: true, category: { select: { slug: true } } },
      })
    : [];

  return NextResponse.json({ productIds, products });
}

// POST /api/wishlist  body: { productId }  — add to wishlist (idempotent)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const productId = body?.productId;
  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  await db.wishlist.upsert({
    where:  { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId },
    update: {},
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
