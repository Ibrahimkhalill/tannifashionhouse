import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { OrderStatusSchema, parseBody } from "@/lib/validators";

// PATCH /api/admin/orders/:id — update order status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id }   = await params;
  const body     = await req.json().catch(() => null);
  const parsed   = parseBody(OrderStatusSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const order = await db.order.update({
    where: { id },
    data:  { status: parsed.data.status },
  });

  return NextResponse.json({ order });
}
