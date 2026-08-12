import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReviewSchema, parseBody } from "@/lib/validators";

// GET /api/reviews?productId=xxx
// productId may be the slug (storefront id) or the cuid.
// Returns all reviews for a product (public)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const product = await db.product.findFirst({
    where: { OR: [{ slug: productId }, { id: productId }] },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ reviews: [] });

  const reviews = await db.review.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    include: {
      user:    { select: { id: true, name: true } },
      replies: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json({ reviews });
}

// POST /api/reviews — add a review
// Rules (real-world / Daraz-style — only genuine buyers can review):
//   - Must be signed in (guests can't be verified as buyers)
//   - Must have a DELIVERED order containing this product (matched by account OR phone)
//   - One review per user per product
export async function POST(req: Request) {
  const session = await auth();

  // 1. Sign-in required — reviews come from real, identifiable customers only.
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to write a review" }, { status: 401 });
  }
  // Staff accounts don't buy, so they can't review.
  if (session.user.role && session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Admin accounts can't post reviews" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = parseBody(ReviewSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { productId: rawProductId, rating, text, images } = parsed.data;

  // productId from the client may be a slug — resolve to the real cuid.
  const product = await db.product.findFirst({
    where: { OR: [{ slug: rawProductId }, { id: rawProductId }] },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const productId = product.id;

  // 2. One review per user per product.
  const already = await db.review.findFirst({
    where: { productId, userId: session.user.id },
  });
  if (already) {
    return NextResponse.json({ error: "You already reviewed this product" }, { status: 409 });
  }

  // 3. Verified purchase gate — a DELIVERED order with this product, linked to the
  //    account OR placed as a guest with the account's phone (covers guest→signup).
  const purchased = await db.order.findFirst({
    where: {
      status: "DELIVERED",
      items: { some: { productId } },
      OR: [
        { userId: session.user.id },
        ...(session.user.phone ? [{ phone: session.user.phone }] : []),
      ],
    },
    select: { id: true },
  });
  if (!purchased) {
    return NextResponse.json(
      { error: "Only verified buyers can review — this product isn't in your delivered orders" },
      { status: 403 },
    );
  }

  const review = await db.review.create({
    data: {
      productId,
      userId:    session.user.id,
      guestName: null,
      rating,
      text,
      images:    images ?? [],
      verified:  true, // reached here only via a verified delivered purchase
    },
    include: {
      user:    { select: { id: true, name: true } },
      replies: true,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
