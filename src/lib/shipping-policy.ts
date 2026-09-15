// Shipping & Returns policy shown on every product page's "Shipping & returns" tab.
// Stored as a single JSON row in SiteConfig (key below) so admins can edit it
// without a deploy. Two fixed sections — Delivery and Returns — each a titled
// bullet list. Icons are fixed by section on the storefront (truck / rotate).

export type PolicySection = { title: string; items: string[] };
export type DeliveryAreaKey = "inside" | "outside";
export type DeliveryAreaConfig = { label: string; price: number };
export type ShippingPolicy = {
  delivery: PolicySection;
  returns: PolicySection;
  deliveryAreas: Record<DeliveryAreaKey, DeliveryAreaConfig>;
};

export const SHIPPING_POLICY_KEY = "shipping-policy";

export const DEFAULT_SHIPPING_POLICY: ShippingPolicy = {
  delivery: {
    title: "Delivery",
    items: [
      "Free shipping on orders over ৳1,500",
      "Standard shipping ৳80",
      "1–3 business days nationwide",
      "Same-day delivery in Dhaka (select areas)",
    ],
  },
  returns: {
    title: "Returns & exchanges",
    items: [
      "Check your item at the time of delivery",
      "Not satisfied? Return it right away with the delivery agent",
      "Item must be unused, in original packaging",
      "Refund processed within 3–5 days",
    ],
  },
  deliveryAreas: {
    inside: { label: "Inside Dhaka", price: 80 },
    outside: { label: "Outside Dhaka", price: 120 },
  },
};

const MAX_ITEMS = 8;
const MAX_LEN = 160;

function normalizeSection(raw: unknown, fallback: PolicySection): PolicySection {
  const r = (raw ?? {}) as Partial<PolicySection>;
  const title = typeof r.title === "string" && r.title.trim() ? r.title.trim().slice(0, MAX_LEN) : fallback.title;
  const items = Array.isArray(r.items)
    ? r.items
        .filter((i): i is string => typeof i === "string" && i.trim().length > 0)
        .map((i) => i.trim().slice(0, MAX_LEN))
        .slice(0, MAX_ITEMS)
    : fallback.items;
  return { title, items: items.length ? items : fallback.items };
}

function normalizeArea(
  raw: unknown,
  fallback: DeliveryAreaConfig,
): DeliveryAreaConfig {
  const r = (raw ?? {}) as Partial<DeliveryAreaConfig>;
  const label = typeof r.label === "string" && r.label.trim()
    ? r.label.trim().slice(0, 60)
    : fallback.label;
  const n = typeof r.price === "number" ? r.price : Number(r.price);
  const price = Number.isFinite(n) ? Math.max(0, Math.min(5000, Math.round(n))) : fallback.price;
  return { label, price };
}

// Coerce anything (parsed JSON, untrusted body) into a valid ShippingPolicy,
// falling back to defaults for missing/invalid parts.
export function normalizePolicy(raw: unknown): ShippingPolicy {
  const r = (raw ?? {}) as Partial<ShippingPolicy>;
  return {
    delivery: normalizeSection(r.delivery, DEFAULT_SHIPPING_POLICY.delivery),
    returns: normalizeSection(r.returns, DEFAULT_SHIPPING_POLICY.returns),
    deliveryAreas: {
      inside: normalizeArea(
        (r.deliveryAreas as Partial<Record<DeliveryAreaKey, DeliveryAreaConfig>> | undefined)?.inside,
        DEFAULT_SHIPPING_POLICY.deliveryAreas.inside,
      ),
      outside: normalizeArea(
        (r.deliveryAreas as Partial<Record<DeliveryAreaKey, DeliveryAreaConfig>> | undefined)?.outside,
        DEFAULT_SHIPPING_POLICY.deliveryAreas.outside,
      ),
    },
  };
}
