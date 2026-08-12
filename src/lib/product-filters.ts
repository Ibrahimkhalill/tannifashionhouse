import type { Product } from "@/components/site/ProductCard";

/** Human-readable labels for catalog hex swatches (filters + PDP). */
export function colorLabelFromHex(hex: string): string {
  const h = hex.toLowerCase().replace("#", "");
  const map: Record<string, string> = {
    f5b6c8: "Pink",
    "7d8ce0": "Lilac",
    ffffff: "White",
    a06b48: "Brown",
    "000000": "Black",
    f08c6e: "Coral",
    "7dd9a0": "Mint",
    d96a7a: "Rose",
    c8b5ff: "Lavender",
    d4b3ff: "Soft lilac",
  };
  return map[h] ?? "Classic";
}

function normalizeHex(raw: string): string {
  const t = raw.trim();
  if (!t) return "#cccccc";
  return t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`;
}

/** Distinct swatches across products, sorted by label. */
export function uniqueColorSwatches(products: Pick<Product, "colors">[]): { hex: string; label: string }[] {
  const seen = new Set<string>();
  const out: { hex: string; label: string }[] = [];
  for (const p of products) {
    for (const raw of p.colors) {
      const hex = normalizeHex(raw);
      if (seen.has(hex)) continue;
      seen.add(hex);
      out.push({ hex, label: colorLabelFromHex(hex) });
    }
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}

export function uniqueBrands(products: Pick<Product, "brand">[]): string[] {
  return [...new Set(products.map((p) => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function productHasAnyColor(product: Pick<Product, "colors">, selectedHexes: string[]): boolean {
  if (selectedHexes.length === 0) return true;
  const set = new Set(selectedHexes.map((h) => h.toLowerCase()));
  return product.colors.some((c) => set.has(normalizeHex(c)));
}
