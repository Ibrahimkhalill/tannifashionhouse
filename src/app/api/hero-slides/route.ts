import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const slides = await db.heroSlide.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(slides);
}
