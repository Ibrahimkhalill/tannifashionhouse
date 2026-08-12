import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products
// Query params:
//   ?category=fashion   filter by category slug
//   ?brand=urbanfit     filter by brand slug
//   ?search=shirt       full-text search on name
//   ?sort=lh|hl|new     price low-high, high-low, newest
//   ?featured=true      only featured products
//   ?trending=true      only trending products
//   ?page=1             page number (default 1)
//   ?limit=12           items per page (max 50)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const category = searchParams.get("category") ?? undefined;
  const brand    = searchParams.get("brand")    ?? undefined;
  const search   = searchParams.get("search")   ?? undefined;
  const sort     = searchParams.get("sort")     ?? "new";
  const featured = searchParams.get("featured") === "true" ? true : undefined;
  const trending = searchParams.get("trending") === "true" ? true : undefined;
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12")));
  const skip     = (page - 1) * limit;

  // Build where clause
  const where = {
    status: "ACTIVE" as const,
    ...(featured !== undefined && { featured }),
    ...(trending !== undefined && { trending }),
    ...(category && { category: { slug: category } }),
    ...(brand    && { brand:    { slug: brand } }),
    ...(search   && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  // Build orderBy
  const orderBy =
    sort === "lh"  ? { price: "asc"  as const } :
    sort === "hl"  ? { price: "desc" as const } :
    /* new */        { createdAt: "desc" as const };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id:         true,
        slug:       true,
        name:       true,
        price:      true,
        oldPrice:   true,
        stock:      true,
        images:     true,
        colors:     true,
        colorImages:true,
        sizes:      true,
        badgeLabel: true,
        badgeTone:  true,
        featured:   true,
        trending:   true,
        subcategory:true,
        category: { select: { name: true, slug: true } },
        brand:    { select: { name: true } },
        // Average rating for the card
        reviews: {
          select: { rating: true },
        },
      },
    }),
    db.product.count({ where }),
  ]);

  // Shape to match frontend Product type
  const shaped = products.map((p) => ({
    id:         p.slug,          // use slug as id for URL-friendly routes
    dbId:       p.id,
    name:       p.name,
    category:   p.category?.slug ?? "",
    subcategory:p.subcategory ?? undefined,
    brand:      p.brand?.name   ?? "",
    price:      p.price,
    oldPrice:   p.oldPrice  ?? undefined,
    stock:      p.stock,
    image:      p.images[0] ?? "",
    images:     p.images,
    colorImages:p.colorImages,
    colors:     p.colors,
    sizes:      p.sizes,
    badge:      p.badgeLabel
      ? { label: p.badgeLabel, tone: p.badgeTone ?? "new" }
      : undefined,
    rating:
      p.reviews.length > 0
        ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length) * 10) / 10
        : null,
    reviewCount: p.reviews.length,
  }));

  return NextResponse.json({
    products: shaped,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
