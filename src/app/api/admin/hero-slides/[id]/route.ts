import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { HeroSlideSchema, parseBody } from "@/lib/validators";

type SlideInput = {
  badge?: string;
  title?: string;
  subtitle?: string;
  cta?: string;
  slug?: string;
  image: string;
  gradient?: string;
  active?: boolean;
  order?: number;
};

function normalizeSlide(data: SlideInput) {
  const title = (data.title ?? "").trim();
  const slug = (data.slug ?? "").trim();
  const cta = (data.cta ?? "").trim();

  return {
    badge: (data.badge ?? "").trim(),
    title: title || "Hero Collection",
    subtitle: (data.subtitle ?? "").trim(),
    cta: cta || "Shop Now",
    slug: slug || "fashion",
    image: data.image.trim(),
    gradient: (data.gradient ?? "").trim() || "from-zinc-900 via-black to-black",
    active: data.active ?? true,
    order: data.order ?? 0,
  };
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = parseBody(HeroSlideSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const slide = await db.heroSlide.update({
    where: { id },
    data: normalizeSlide(parsed.data),
  });
  return NextResponse.json({ slide });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await db.heroSlide.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
