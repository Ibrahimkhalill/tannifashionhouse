import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { OfferSchema, parseBody } from "@/lib/validators";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const offers = await db.offer.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ offers });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(OfferSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const offer = await db.offer.create({
    data: {
      ...parsed.data,
      expiryDate: new Date(parsed.data.expiryDate),
      status: parsed.data.status as "ACTIVE" | "INACTIVE",
    },
  });
  return NextResponse.json({ offer }, { status: 201 });
}
