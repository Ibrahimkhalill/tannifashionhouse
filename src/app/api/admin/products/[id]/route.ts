import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminProductSchema, parseBody } from "@/lib/validators";

// GET /api/admin/products/:id
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { variants: true, category: true, brand: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ product });
}

// PUT /api/admin/products/:id — full update
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = parseBody(AdminProductSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { variants, ...data } = parsed.data;

  // Replace all variants
  const product = await db.product.update({
    where: { id },
    data: {
      ...data,
      status:      data.status as "ACTIVE" | "DRAFT" | "ARCHIVED",
      colors:      data.colors      ?? [],
      colorImages: data.colorImages ?? [],
      sizes:       data.sizes        ?? [],
      tags:        data.tags         ?? [],
      variants: {
        deleteMany: {},
        ...(variants?.length ? { createMany: { data: variants } } : {}),
      },
    },
    include: { variants: true },
  });

  return NextResponse.json({ product });
}

// DELETE /api/admin/products/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
