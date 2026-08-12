import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { SizeSchema, parseBody } from "@/lib/validators";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const sizes = await db.size.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ sizes });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(SizeSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const size = await db.size.create({
    data: { ...parsed.data, status: parsed.data.status as "ACTIVE" | "INACTIVE" },
  });
  return NextResponse.json({ size }, { status: 201 });
}
