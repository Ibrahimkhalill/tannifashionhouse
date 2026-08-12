import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories
// ?parent=true   → only top-level (parentId = null)
// ?slug=fashion  → subcategories of that parent
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentOnly = searchParams.get("parent") === "true";
  const parentSlug = searchParams.get("slug") ?? undefined;

  if (parentSlug) {
    const parent = await db.category.findUnique({ where: { slug: parentSlug } });
    if (!parent) return NextResponse.json({ categories: [] });

    const categories = await db.category.findMany({
      where: { parentId: parent.id, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  }

  const categories = await db.category.findMany({
    where: {
      status: "ACTIVE",
      ...(parentOnly ? { parentId: null } : {}),
    },
    orderBy: { name: "asc" },
    include: {
      children: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      },
    },
  });

  return NextResponse.json({ categories });
}
