import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { CategorySchema, parseBody } from "@/lib/validators";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const categories = await db.category.findMany({
    orderBy: { createdAt: "asc" },
    include: { children: true },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(CategorySchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const category = await db.category.create({
    data: {
      ...parsed.data,
      status: parsed.data.status as "ACTIVE" | "INACTIVE",
    },
  });
  return NextResponse.json({ category }, { status: 201 });
}
