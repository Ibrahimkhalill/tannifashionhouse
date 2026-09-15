import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const slides = await db.heroSlide.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(slides, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
