import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cache each unique query string (category/brand/search/sort/page/...) for
// 60s — homepage sections (featured/trending/new) repeat the exact same
// request on every visit, so this turns most loads into a cache hit instead
// of a fresh DB round trip. Admin product changes show up within a minute.
export const revalidate = 60;

// GET /api/products
// Query params:
//   ?category=fashion   filter by category slug (also includes child categories)
//   ?sub=saree          optional sub/type/category slug matcher
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
  const sub = (searchParams.get("sub") ?? "").trim();
  const brand = searchParams.get("brand") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const sort = searchParams.get("sort") ?? "new";
  const featured = searchParams.get("featured") === "true" ? true : undefined;
  const trending = searchParams.get("trending") === "true" ? true : undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12")));
  const skip = (page - 1) * limit;

  const andFilters: Array<Record<string, unknown>> = [];

  if (category) {
    andFilters.push({
      OR: [
        { category: { slug: category } },
        { category: { parent: { slug: category } } },
      ],
    });
  }

  if (sub) {
    andFilters.push({
      OR: [
        { category: { slug: sub } },
        { category: { parent: { slug: sub } } },
        { subcategory: { equals: sub, mode: "insensitive" as const } },
      ],
    });
  }

  const where = {
    status: "ACTIVE" as const,
    ...(featured !== undefined && { featured }),
    ...(trending !== undefined && { trending }),
    ...(andFilters.length > 0 && { AND: andFilters }),
    ...(brand && { brand: { slug: brand } }),
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  const orderBy =
    sort === "lh" ? { price: "asc" as const } :
    sort === "hl" ? { price: "desc" as const } :
    { createdAt: "desc" as const };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        oldPrice: true,
        stock: true,
        images: true,
        colors: true,
        colorImages: true,
        sizes: true,
        badgeLabel: true,
        badgeTone: true,
        featured: true,
        trending: true,
        subcategory: true,
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true } },
        reviews: {
          select: { rating: true },
        },
      },
    }),
    db.product.count({ where }),
  ]);

  const shaped = products.map((p) => ({
    id: p.slug,
    dbId: p.id,
    name: p.name,
    category: p.category?.slug ?? "",
    subcategory: p.subcategory ?? undefined,
    brand: p.brand?.name ?? "",
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    stock: p.stock,
    image: p.images[0] ?? "",
    images: p.images,
    colorImages: p.colorImages,
    colors: p.colors,
    sizes: p.sizes,
    badge: p.badgeLabel
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
