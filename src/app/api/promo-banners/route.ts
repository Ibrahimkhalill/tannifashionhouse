import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cache for 60s — see /api/hero-slides for why.
export const revalidate = 60;

export async function GET() {
  const banners = await db.promoBanner.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(banners);
}
