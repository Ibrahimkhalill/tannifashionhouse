import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminProductSchema, parseBody } from "@/lib/validators";

// GET /api/admin/products — list all products (any status)
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const skip  = (page - 1) * limit;

  const [products, total] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        category: { select: { name: true, slug: true } },
        brand:    { select: { name: true } },
        variants: true,
        _count:   { select: { reviews: true, orderItems: true } },
      },
    }),
    db.product.count(),
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
}

// POST /api/admin/products — create a new product
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = parseBody(AdminProductSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { variants, ...data } = parsed.data;

  const product = await db.product.create({
    data: {
      ...data,
      status:     data.status as "ACTIVE" | "DRAFT" | "ARCHIVED",
      colors:     data.colors     ?? [],
      colorImages:data.colorImages ?? [],
      sizes:      data.sizes       ?? [],
      tags:       data.tags        ?? [],
      variants: variants?.length
        ? { createMany: { data: variants } }
        : undefined,
    },
    include: { variants: true },
  });

  return NextResponse.json({ product }, { status: 201 });
}
