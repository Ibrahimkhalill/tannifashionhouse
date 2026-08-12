import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products/:id
// :id can be the product slug (preferred for SEO) or the cuid
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await db.product.findFirst({
    where: {
      OR: [{ slug: id }, { id }],
      status: "ACTIVE",
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand:    { select: { id: true, name: true, slug: true } },
      variants: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          user:    { select: { id: true, name: true } },
          replies: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Real "units sold" — sum of ordered qty across all non-cancelled orders.
  const soldAgg = await db.orderItem.aggregate({
    where: { productId: product.id, order: { status: { not: "CANCELLED" } } },
    _sum: { qty: true },
  });
  const soldCount = soldAgg._sum.qty ?? 0;

  // Real SKU — first variant that has one (Product itself has no SKU column).
  const sku = product.variants.find((v) => v.sku)?.sku ?? null;

  // Shape to the storefront Product type (flat category/brand strings + image),
  // matching GET /api/products so every consumer (product page, resolveProduct,
  // useProductCache) gets a consistent object. Keep reviews/variants for detail.
  const shaped = {
    id:          product.slug,        // URL-friendly id used across the storefront
    dbId:        product.id,
    slug:        product.slug,
    name:        product.name,
    description: product.description ?? "",
    metaDesc:    product.metaDesc ?? undefined,
    sku:         sku ?? undefined,
    soldCount,
    category:    product.category?.slug ?? "",
    categoryName: product.category?.name ?? "",
    subcategory: product.subcategory ?? undefined,
    brand:       product.brand?.name ?? "",
    material:    product.material ?? undefined,
    price:       product.price,
    oldPrice:    product.oldPrice ?? undefined,
    stock:       product.stock,
    image:       product.images[0] ?? "",
    images:      product.images,
    colorImages: product.colorImages,
    colors:      product.colors,
    sizes:       product.sizes,
    badge:       product.badgeLabel
      ? { label: product.badgeLabel, tone: product.badgeTone ?? "new" }
      : undefined,
    variants:    product.variants,
    reviews:     product.reviews,
  };

  return NextResponse.json({ product: shaped });
}
