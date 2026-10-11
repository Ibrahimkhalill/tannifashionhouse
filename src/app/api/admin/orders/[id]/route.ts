import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { OrderStatusSchema, parseBody } from "@/lib/validators";
import { prismaErrorResponse } from "@/lib/api-errors";
import { findVariant } from "@/lib/variant-pricing";

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

  const next = parsed.data.status;

  try {
    const order = await db.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        include: { items: { include: { product: { select: { variants: true } } } } },
      });
      if (!current) return null;

      // Stock is reserved when an order is placed, so put it back on cancel —
      // and take it again if a cancelled order is reopened.
      const wasCancelled = current.status === "CANCELLED";
      const isCancelled  = next === "CANCELLED";
      if (wasCancelled !== isCancelled) {
        const op = isCancelled ? "increment" : "decrement";
        for (const it of current.items) {
          await tx.product.update({ where: { id: it.productId }, data: { stock: { [op]: it.qty } } });
          // Same matching rule the order route used when it took the stock.
          const variant = findVariant(it.product.variants, it.size, it.color);
          if (variant) {
            await tx.productVariant.update({ where: { id: variant.id }, data: { stock: { [op]: it.qty } } });
          }
        }
      }

      return tx.order.update({ where: { id }, data: { status: next } });
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (e) {
    return prismaErrorResponse(e);
  }
}
