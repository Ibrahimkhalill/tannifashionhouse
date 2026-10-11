import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { BrandSchema, parseBody } from "@/lib/validators";
import { prismaErrorResponse } from "@/lib/api-errors";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = parseBody(BrandSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const brand = await db.brand.update({
      where: { id },
      data: {
        ...parsed.data,
        status: parsed.data.status as "ACTIVE" | "INACTIVE",
      },
    });
    return NextResponse.json({ brand });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await db.brand.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
