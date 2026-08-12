import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { BrandSchema, parseBody } from "@/lib/validators";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const brands = await db.brand.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ brands });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(BrandSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const brand = await db.brand.create({
    data: {
      ...parsed.data,
      status: parsed.data.status as "ACTIVE" | "INACTIVE",
    },
  });
  return NextResponse.json({ brand }, { status: 201 });
}
