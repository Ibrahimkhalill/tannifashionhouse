import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Mask a phone/email so a random order-ID guesser can't harvest full contact
// details, while still letting the customer recognise their own order.
function maskPhone(p: string) {
  if (p.length <= 5) return p;
  return p.slice(0, 3) + "*".repeat(p.length - 5) + p.slice(-2);
}
function maskEmail(e: string) {
  const [name, domain] = e.split("@");
  if (!domain) return e;
  const head = name.length <= 2 ? name[0] ?? "" : name.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, name.length - head.length))}@${domain}`;
}

// GET /api/orders/:id
// Anyone with the order ID can view its tracking status (the order ID is the
// secret token). The owner and admins see full contact details; everyone else
// gets phone/email masked to limit PII exposure.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }  = await params;
  const session = await auth();

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, images: true, slug: true, price: true },
          },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isOwner = session?.user?.id && order.userId === session.user.id;
  const isAdmin = session?.user?.role === "ADMIN";

  // Full details for the owner/admin; masked contact info for everyone else.
  const safeOrder = isOwner || isAdmin
    ? order
    : {
        ...order,
        phone: maskPhone(order.phone),
        email: order.email ? maskEmail(order.email) : order.email,
      };

  return NextResponse.json({ order: safeOrder });
}
