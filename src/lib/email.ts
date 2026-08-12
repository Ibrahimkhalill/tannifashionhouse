import nodemailer from "nodemailer";

// ── SMTP config (from .env) ──────────────────────────────────────────────────
const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT ?? 465);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const FROM = process.env.SMTP_FROM || (USER ? `Tanni Fashion House <${USER}>` : undefined);
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || USER;
const BRAND = "Tanni Fashion House";

export type OrderEmailItem = { name: string; qty: number; price: number; size?: string | null; color?: string | null };
export type OrderEmailInfo = {
  id: string; name: string; phone: string; email?: string | null;
  address: string; district: string; division: string;
  items: OrderEmailItem[]; subtotal: number; shippingCost: number; discount: number; total: number;
};

// Returns null when SMTP isn't configured — callers skip sending silently.
function makeTransport() {
  if (!HOST || !USER || !PASS) return null;
  return nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user: USER, pass: PASS },
  });
}

const tk = (n: number) => `৳${n.toLocaleString()}`;

function itemsRows(items: OrderEmailItem[]) {
  return items.map((i) => {
    const variant = [i.color, i.size].filter(Boolean).join(" · ");
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#111">
        ${i.name}${variant ? `<br><span style="font-size:12px;color:#888">${variant}</span>` : ""}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#555;text-align:center">×${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#111;text-align:right">${tk(i.price * i.qty)}</td>
    </tr>`;
  }).join("");
}

function orderHtml(o: OrderEmailInfo, forAdmin: boolean) {
  const heading = forAdmin ? "New order received 🛎️" : "Thank you for your order! 🎉";
  const intro = forAdmin
    ? `A new order has been placed on ${BRAND}.`
    : `Hi ${o.name}, we've received your order and will start preparing it. You'll pay <b>Cash on Delivery</b> when it arrives.`;
  return `<div style="max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#fff">
    <div style="background:#000;padding:20px 24px">
      <span style="color:#10b981;font-size:20px;font-weight:800">Tanni</span>
      <span style="color:#fff;font-size:20px;font-weight:800"> Fashion House</span>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 6px;font-size:20px;color:#111">${heading}</h2>
      <p style="margin:0 0 4px;font-size:14px;color:#555;line-height:1.6">${intro}</p>
      <p style="margin:12px 0;font-size:14px;color:#111"><b>Order ID:</b> ${o.id}</p>

      <table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead>
          <tr>
            <th style="text-align:left;font-size:12px;color:#888;text-transform:uppercase;padding-bottom:6px">Item</th>
            <th style="text-align:center;font-size:12px;color:#888;text-transform:uppercase;padding-bottom:6px">Qty</th>
            <th style="text-align:right;font-size:12px;color:#888;text-transform:uppercase;padding-bottom:6px">Price</th>
          </tr>
        </thead>
        <tbody>${itemsRows(o.items)}</tbody>
      </table>

      <table style="width:100%;margin-top:14px;font-size:14px;color:#555">
        <tr><td>Subtotal</td><td style="text-align:right">${tk(o.subtotal)}</td></tr>
        <tr><td>Delivery</td><td style="text-align:right">${tk(o.shippingCost)}</td></tr>
        ${o.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">−${tk(o.discount)}</td></tr>` : ""}
        <tr><td style="padding-top:8px;font-size:16px;font-weight:800;color:#111">Total</td>
            <td style="padding-top:8px;font-size:16px;font-weight:800;color:#10b981;text-align:right">${tk(o.total)}</td></tr>
      </table>

      <div style="margin-top:18px;padding:14px;background:#f7f7f7;border-radius:10px">
        <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;font-weight:700">Delivery to</p>
        <p style="margin:0;font-size:14px;color:#111;line-height:1.6">
          ${o.name} · ${o.phone}<br>${o.address}, ${o.district}, ${o.division}
        </p>
      </div>

      <p style="margin:20px 0 0;font-size:12px;color:#aaa">Payment: Cash on Delivery — pay when you receive.</p>
    </div>
  </div>`;
}

export async function sendOrderEmails(o: OrderEmailInfo) {
  const transport = makeTransport();
  if (!transport || !FROM) return; // SMTP not configured — no-op

  const tasks: Promise<unknown>[] = [];
  if (o.email) {
    tasks.push(transport.sendMail({
      from: FROM, to: o.email,
      subject: `Order confirmed — ${o.id} · Tanni Fashion House`,
      html: orderHtml(o, false),
    }));
  }
  if (ADMIN_EMAIL) {
    tasks.push(transport.sendMail({
      from: FROM, to: ADMIN_EMAIL,
      subject: `🛎️ New order ${o.id} — ${tk(o.total)}`,
      html: orderHtml(o, true),
    }));
  }
  await Promise.allSettled(tasks);
}
