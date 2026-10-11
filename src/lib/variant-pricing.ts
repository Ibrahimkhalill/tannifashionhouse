// Shared by the storefront (product page, cart, checkout) and the order API so the
// price a customer sees is exactly the price the server charges.

export type VariantLite = {
  id?: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  sku?: string | null;
};

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

// Admin variants come in three shapes: color-only (size ""), size-only
// (color ""), or color+size. A blank field on a variant means "any", and the
// most specific match wins. Returns undefined when nothing matches.
export function findVariant<V extends VariantLite>(
  variants: V[] | undefined | null,
  size?: string | null,
  color?: string | null,
): V | undefined {
  if (!variants?.length) return undefined;
  const s = norm(size);
  const c = norm(color);
  let best: V | undefined;
  let bestScore = -1;
  for (const v of variants) {
    const vs = norm(v.size);
    const vc = norm(v.color);
    if (vs && vs !== s) continue;
    if (vc && vc !== c) continue;
    const score = (vs ? 1 : 0) + (vc ? 1 : 0);
    if (score > bestScore) { best = v; bestScore = score; }
  }
  return best;
}

// Unit price for a size/color choice — the matching variant's price, else the base price.
export function unitPrice(
  product: { price: number; variants?: VariantLite[] | null },
  size?: string | null,
  color?: string | null,
): number {
  return findVariant(product.variants, size, color)?.price ?? product.price;
}
