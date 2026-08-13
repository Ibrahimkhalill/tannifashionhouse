import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public list of admin-defined colours (name + hex) so the storefront can label a
// product's colour swatches with the real names the admin set in Attributes → Colors
// (instead of a hardcoded guess). Cached 5 min.
export const revalidate = 300;

export async function GET() {
  const colors = await db.color.findMany({
    where: { status: "ACTIVE" },
    select: { name: true, hex: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ colors });
}
