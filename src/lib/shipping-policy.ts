// Shipping & Returns policy shown on every product page's "Shipping & returns" tab.
// Stored as a single JSON row in SiteConfig (key below) so admins can edit it
// without a deploy. Two fixed sections — Delivery and Returns — each a titled
// bullet list. Icons are fixed by section on the storefront (truck / rotate).

export type PolicySection = { title: string; items: string[] };
export type ShippingPolicy = { delivery: PolicySection; returns: PolicySection };

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
      "7-day return window from delivery",
      "Item must be unused, original packaging",
      "Free return pickup in Dhaka",
      "Refund processed within 3–5 days",
    ],
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

// Coerce anything (parsed JSON, untrusted body) into a valid ShippingPolicy,
// falling back to defaults for missing/invalid parts.
export function normalizePolicy(raw: unknown): ShippingPolicy {
  const r = (raw ?? {}) as Partial<ShippingPolicy>;
  return {
    delivery: normalizeSection(r.delivery, DEFAULT_SHIPPING_POLICY.delivery),
    returns: normalizeSection(r.returns, DEFAULT_SHIPPING_POLICY.returns),
  };
}
