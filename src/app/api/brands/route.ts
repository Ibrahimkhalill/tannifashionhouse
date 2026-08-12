import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/brands — returns all active brands
export async function GET() {
  const brands = await db.brand.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ brands });
}
