import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { HeroSlideSchema, parseBody } from "@/lib/validators";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const slides = await db.heroSlide.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ slides });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(HeroSlideSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const slide = await db.heroSlide.create({
    data: { ...parsed.data, image: parsed.data.image ?? "", active: parsed.data.active ?? true, order: parsed.data.order ?? 0 },
  });
  return NextResponse.json({ slide }, { status: 201 });
}
