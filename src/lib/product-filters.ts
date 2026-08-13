import type { Product } from "@/components/site/ProductCard";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.toLowerCase().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16) || 0;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Named colours used to label ANY hex by nearest match — so a swatch always shows
// a human name (e.g. "Coral", "Cream") instead of a hex code or "Classic".
const NAMED_COLORS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#000000" }, { name: "White", hex: "#ffffff" },
  { name: "Gray", hex: "#808080" }, { name: "Silver", hex: "#c0c0c0" },
  { name: "Red", hex: "#e11d48" }, { name: "Maroon", hex: "#800000" },
  { name: "Coral", hex: "#f0708a" }, { name: "Salmon", hex: "#fa8072" },
  { name: "Pink", hex: "#ec4899" }, { name: "Light Pink", hex: "#f5b6c8" },
  { name: "Rose", hex: "#d96a7a" }, { name: "Magenta", hex: "#d6336c" },
  { name: "Orange", hex: "#f97316" }, { name: "Gold", hex: "#eab308" },
  { name: "Yellow", hex: "#facc15" }, { name: "Cream", hex: "#f3ead0" },
  { name: "Beige", hex: "#ead9a0" }, { name: "Brown", hex: "#a06b48" }, { name: "Tan", hex: "#d2b48c" },
  { name: "Green", hex: "#22c55e" }, { name: "Olive", hex: "#808000" },
  { name: "Emerald", hex: "#059669" }, { name: "Mint", hex: "#7dd9a0" }, { name: "Teal", hex: "#14b8a6" },
  { name: "Blue", hex: "#3b82f6" }, { name: "Navy", hex: "#1e3a5f" },
  { name: "Sky", hex: "#7dd3fc" }, { name: "Cyan", hex: "#06b6d4" },
  { name: "Purple", hex: "#a855f7" }, { name: "Violet", hex: "#7c3aed" },
  { name: "Lavender", hex: "#c8b5ff" }, { name: "Lilac", hex: "#d4b3ff" },
];

/** Human-readable label for any hex — nearest named colour (filters, PDP, admin). */
export function colorLabelFromHex(hex: string): string {
  const { r, g, b } = hexToRgb(hex || "#cccccc");
  let best = "Classic";
  let bestDist = Infinity;
  for (const c of NAMED_COLORS) {
    const cr = hexToRgb(c.hex);
    const d = (r - cr.r) ** 2 + (g - cr.g) ** 2 + (b - cr.b) ** 2;
    if (d < bestDist) { bestDist = d; best = c.name; }
  }
  return best;
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
