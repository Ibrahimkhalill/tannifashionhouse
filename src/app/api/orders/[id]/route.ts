import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, limitOrNull, MINUTE } from "@/lib/rate-limit";

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

const digits = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.startsWith("880") ? "0" + d.slice(3) : d;
};

// GET /api/orders/:id[?phone=01XXXXXXXXX]
// Anyone with the order ID can view its tracking status. Full contact details
// (name, address, phone, email, notes) are only returned to the owner, admins,
// or a guest who also supplies the order's phone number (the checkout page
// stores it locally). Everyone else gets a redacted copy.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Stops scanning order IDs / guessing the phone number for one.
  const limited = await limitOrNull(`order-view:ip:${clientIp(req)}`, 60, 10 * MINUTE);
  if (limited) return limited;

  const { id }  = await params;
  const session = await auth();
  const phoneQ  = new URL(req.url).searchParams.get("phone") ?? "";

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

  const isOwner    = session?.user?.id && order.userId === session.user.id;
  const isAdmin    = session?.user?.role === "ADMIN";
  const knowsPhone = phoneQ !== "" && digits(phoneQ) === digits(order.phone);

  // Full details for the owner/admin/phone-holder; redacted for everyone else.
  const safeOrder = isOwner || isAdmin || knowsPhone
    ? order
    : {
        ...order,
        userId:  null,
        name:    order.name.split(/\s+/)[0] ?? "",
        phone:   maskPhone(order.phone),
        email:   order.email ? maskEmail(order.email) : order.email,
        address: "Hidden — sign in or use the device you ordered from",
        notes:   null,
      };

  return NextResponse.json({ order: safeOrder });
}
