import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/reviews/eligibility?productId=slug-or-cuid
// Tells the client whether the signed-in user may write a review for this product.
// Mirrors the POST gate: signed-in customer + DELIVERED order (by account or phone)
// + hasn't already reviewed. productId may be a slug or a cuid.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawProductId = searchParams.get("productId");
  if (!rawProductId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const session = await auth();
  if (!session?.user?.id || (session.user.role && session.user.role !== "CUSTOMER")) {
    return NextResponse.json({ eligible: false, purchased: false, alreadyReviewed: false });
  }

  const product = await db.product.findFirst({
    where: { OR: [{ slug: rawProductId }, { id: rawProductId }] },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ eligible: false, purchased: false, alreadyReviewed: false });

  const [alreadyReviewed, purchased] = await Promise.all([
    db.review.findFirst({ where: { productId: product.id, userId: session.user.id }, select: { id: true } }),
    db.order.findFirst({
      where: {
        status: "DELIVERED",
        items: { some: { productId: product.id } },
        OR: [
          { userId: session.user.id },
          ...(session.user.phone ? [{ phone: session.user.phone }] : []),
        ],
      },
      select: { id: true },
    }),
  ]);

  return NextResponse.json({
    eligible: !!purchased && !alreadyReviewed,
    purchased: !!purchased,
    alreadyReviewed: !!alreadyReviewed,
  });
}
