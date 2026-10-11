import nodemailer from "nodemailer";

// ── SMTP config (from .env) ──────────────────────────────────────────────────
const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT ?? 465);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const FROM = process.env.SMTP_FROM || (USER ? `Tanni Fashion House <${USER}>` : undefined);
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || USER;
// Where customer replies go (FROM is usually a noreply address).
const REPLY_TO = process.env.SMTP_REPLY_TO || process.env.ADMIN_NOTIFY_EMAIL || undefined;
const BRAND = "Tanni Fashion House";
const SITE_URL = (process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://www.tannifashionhouse.com").replace(/\/$/, "");

export type OrderEmailItem = {
  name: string; qty: number; price: number;
  size?: string | null; color?: string | null; image?: string | null;
};
export type OrderEmailInfo = {
  id: string; name: string; phone: string; email?: string | null;
  address: string; district: string; division: string;
  notes?: string | null; payment?: string; deliveryLabel?: string;
  items: OrderEmailItem[]; subtotal: number; shippingCost: number; discount: number; total: number;
};

// Customer-supplied text goes into HTML — escape it.
const esc = (s: string | null | undefined) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery", bkash: "bKash", nagad: "Nagad", card: "Card",
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
    const variant = esc([i.color, i.size].filter(Boolean).join(" · "));
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#111">
        ${esc(i.name)}${variant ? `<br><span style="font-size:12px;color:#888">${variant}</span>` : ""}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#555;text-align:center">×${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#111;text-align:right">${tk(i.price * i.qty)}</td>
    </tr>`;
  }).join("");
}

// Customer confirmation email.
function customerHtml(o: OrderEmailInfo) {
  const heading = "Thank you for your order! 🎉";
  const intro = `Hi ${esc(o.name)}, we've received your order and will start preparing it. You'll pay <b>Cash on Delivery</b> when it arrives.`;
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
          ${esc(o.name)} · ${esc(o.phone)}<br>${esc(o.address)}, ${esc(o.district)}, ${esc(o.division)}
        </p>
      </div>

      <p style="margin:20px 0 0;font-size:12px;color:#aaa">Payment: Cash on Delivery — pay when you receive.</p>
    </div>
  </div>`;
}

// ── Admin "new order" email ─────────────────────────────────────────────────
// Table-based layout + inline styles so it renders the same in Gmail/Outlook/mobile.

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("880") ? digits : digits.startsWith("0") ? `88${digits}` : digits;
  return `https://wa.me/${intl}`;
}

function btn(href: string, label: string, bg: string, color = "#ffffff", border = bg) {
  return `<td style="padding:4px">
    <a href="${esc(href)}" style="display:inline-block;padding:10px 18px;background:${bg};color:${color};border:1px solid ${border};font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;white-space:nowrap">${label}</a>
  </td>`;
}

function label(text: string) {
  return `<p style="margin:0 0 10px;font-size:11px;letter-spacing:1px;color:#9ca3af;text-transform:uppercase;font-weight:700">${text}</p>`;
}

function infoRow(k: string, v: string) {
  return `<tr>
    <td style="padding:5px 0;font-size:13px;color:#6b7280;width:96px;vertical-align:top">${k}</td>
    <td style="padding:5px 0;font-size:14px;color:#111827;font-weight:600">${v}</td>
  </tr>`;
}

function adminItemRows(items: OrderEmailItem[]) {
  return items.map((i) => {
    const chips = [i.color, i.size].filter(Boolean)
      .map((c) => `<span style="display:inline-block;margin:4px 4px 0 0;padding:2px 8px;background:#f3f4f6;border-radius:999px;font-size:11px;color:#4b5563">${esc(c)}</span>`)
      .join("");
    const img = i.image && /^https?:\/\//.test(i.image)
      ? `<img src="${esc(i.image)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb">`
      : `<div style="width:56px;height:56px;border-radius:8px;background:#f3f4f6"></div>`;
    return `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;width:68px;vertical-align:top">${img}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;vertical-align:top">
        <p style="margin:0;font-size:14px;font-weight:600;color:#111827;line-height:1.4">${esc(i.name)}</p>
        ${chips}
        <p style="margin:6px 0 0;font-size:12px;color:#6b7280">${tk(i.price)} × ${i.qty}</p>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;text-align:right;font-size:14px;font-weight:700;color:#111827;white-space:nowrap">${tk(i.price * i.qty)}</td>
    </tr>`;
  }).join("");
}

function adminHtml(o: OrderEmailInfo) {
  const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
  const placedAt = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
  const payment = PAYMENT_LABELS[o.payment ?? "cod"] ?? o.payment ?? "Cash on Delivery";
  const isCod = (o.payment ?? "cod") === "cod";
  const card = `background:#ffffff;border:1px solid #e5e7eb;border-radius:12px`;

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

  <!-- Header -->
  <tr><td style="background:#0a0a0a;border-radius:14px 14px 0 0;padding:20px 24px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:18px;font-weight:800;color:#ffffff"><span style="color:#10b981">Tanni</span> Fashion House</td>
      <td align="right"><span style="display:inline-block;padding:5px 12px;background:#10b981;color:#ffffff;font-size:11px;font-weight:800;letter-spacing:1px;border-radius:999px">NEW ORDER</span></td>
    </tr></table>
  </td></tr>

  <!-- Hero -->
  <tr><td style="background:#ffffff;padding:28px 24px 20px;text-align:center;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb">
    <p style="margin:0;font-size:13px;color:#6b7280">🛎️ You've received a new order</p>
    <p style="margin:8px 0 4px;font-size:38px;font-weight:800;color:#111827;letter-spacing:-1px">${tk(o.total)}</p>
    <p style="margin:0;font-size:13px;color:#6b7280">${itemCount} item${itemCount === 1 ? "" : "s"} · ${esc(payment)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px auto 0;background:#f9fafb;border:1px dashed #d1d5db;border-radius:8px"><tr>
      <td style="padding:8px 14px;font-size:13px;color:#374151">Order <b style="color:#111827">${esc(o.id)}</b> &nbsp;·&nbsp; ${placedAt}</td>
    </tr></table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px auto 0"><tr>
      ${btn(`${SITE_URL}/admin/orders`, "View in admin →", "#111827")}
      ${btn(`tel:${o.phone}`, "📞 Call", "#ffffff", "#111827", "#d1d5db")}
      ${btn(waLink(o.phone), "WhatsApp", "#25D366")}
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#f9fafb;padding:20px 16px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px">

    ${o.notes ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px"><tr><td style="padding:14px 16px">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;color:#b45309;text-transform:uppercase;font-weight:700">📝 Customer note</p>
      <p style="margin:0;font-size:14px;color:#78350f;line-height:1.5">${esc(o.notes)}</p>
    </td></tr></table>` : ""}

    <!-- Customer -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${card};margin-bottom:14px"><tr><td style="padding:16px 18px">
      ${label("Customer")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${infoRow("Name", esc(o.name))}
        ${infoRow("Phone", `<a href="tel:${esc(o.phone)}" style="color:#059669;text-decoration:none">${esc(o.phone)}</a>`)}
        ${o.email ? infoRow("Email", `<a href="mailto:${esc(o.email)}" style="color:#059669;text-decoration:none">${esc(o.email)}</a>`) : ""}
        ${infoRow("Address", `${esc(o.address)}<br><span style="font-weight:400;color:#4b5563">${esc(o.district)}, ${esc(o.division)}</span>`)}
        ${o.deliveryLabel ? infoRow("Delivery", esc(o.deliveryLabel)) : ""}
      </table>
    </td></tr></table>

    <!-- Items -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${card};margin-bottom:14px"><tr><td style="padding:16px 18px 6px">
      ${label(`Items (${itemCount})`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${adminItemRows(o.items)}</table>
    </td></tr></table>

    <!-- Summary -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${card}"><tr><td style="padding:16px 18px">
      ${label("Payment summary")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#4b5563">
        <tr><td style="padding:4px 0">Subtotal</td><td style="padding:4px 0;text-align:right">${tk(o.subtotal)}</td></tr>
        <tr><td style="padding:4px 0">Delivery${o.deliveryLabel ? ` (${esc(o.deliveryLabel)})` : ""}</td><td style="padding:4px 0;text-align:right">${tk(o.shippingCost)}</td></tr>
        ${o.discount > 0 ? `<tr><td style="padding:4px 0">Discount</td><td style="padding:4px 0;text-align:right;color:#dc2626">−${tk(o.discount)}</td></tr>` : ""}
        <tr><td colspan="2" style="padding:8px 0 0"><div style="border-top:1px solid #e5e7eb"></div></td></tr>
        <tr><td style="padding:10px 0 0;font-size:16px;font-weight:800;color:#111827">Total</td>
            <td style="padding:10px 0 0;text-align:right;font-size:18px;font-weight:800;color:#059669">${tk(o.total)}</td></tr>
      </table>
      ${isCod ? `<p style="margin:14px 0 0;padding:10px 12px;background:#ecfdf5;border-radius:8px;font-size:13px;color:#065f46">💵 Collect <b>${tk(o.total)}</b> in cash on delivery.</p>` : ""}
    </td></tr></table>

    <p style="margin:18px 0 0;text-align:center;font-size:12px;color:#9ca3af">Reply to this email to contact the customer${o.email ? "" : " (no email provided — call instead)"}.</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

export async function sendOrderEmails(o: OrderEmailInfo) {
  const transport = makeTransport();
  if (!transport || !FROM) return; // SMTP not configured — no-op

  const tasks: Promise<unknown>[] = [];
  if (o.email) {
    tasks.push(transport.sendMail({
      from: FROM, to: o.email, replyTo: REPLY_TO,
      subject: `Order confirmed — ${o.id} · Tanni Fashion House`,
      html: customerHtml(o),
    }));
  }
  if (ADMIN_EMAIL) {
    tasks.push(transport.sendMail({
      from: FROM, to: ADMIN_EMAIL, replyTo: o.email || undefined,
      subject: `🛎️ New order ${o.id} — ${tk(o.total)}`,
      html: adminHtml(o),
    }));
  }
  await Promise.allSettled(tasks);
}
