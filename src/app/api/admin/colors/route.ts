import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { ColorSchema, parseBody } from "@/lib/validators";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const colors = await db.color.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ colors });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(ColorSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const color = await db.color.create({
    data: { ...parsed.data, status: parsed.data.status as "ACTIVE" | "INACTIVE" },
  });
  return NextResponse.json({ color }, { status: 201 });
}
