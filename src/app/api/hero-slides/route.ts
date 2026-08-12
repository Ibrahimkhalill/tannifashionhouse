import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cache for 60s — the homepage hits this on every load; admin changes show
// up within a minute instead of hitting the DB on every single visit.
export const revalidate = 60;

export async function GET() {
  const slides = await db.heroSlide.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(slides);
}
