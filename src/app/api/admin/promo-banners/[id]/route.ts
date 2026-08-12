import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { PromoBannerSchema, parseBody } from "@/lib/validators";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = parseBody(PromoBannerSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const banner = await db.promoBanner.update({
    where: { id },
    data: { ...parsed.data, active: parsed.data.active ?? true, order: parsed.data.order ?? 0 },
  });
  return NextResponse.json({ banner });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await db.promoBanner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
