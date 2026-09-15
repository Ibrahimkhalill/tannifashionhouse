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

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const slides = await db.heroSlide.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ slides });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = parseBody(HeroSlideSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const slide = await db.heroSlide.create({
    data: normalizeSlide(parsed.data),
  });
  return NextResponse.json({ slide }, { status: 201 });
}
