import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { PromoBannerSchema, parseBody } from "@/lib/validators";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const banners = await db.promoBanner.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ banners });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(PromoBannerSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const banner = await db.promoBanner.create({
    data: { ...parsed.data, active: parsed.data.active ?? true, order: parsed.data.order ?? 0 },
  });
  return NextResponse.json({ banner }, { status: 201 });
}
