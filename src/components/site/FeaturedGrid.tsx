"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Product } from "./ProductCard";
import { useT } from "@/lib/i18n";
import { cachedJson } from "@/lib/api-cache";

const TABS = [
  { label: "All",      filter: null },
  { label: "T-Shirts", filter: "T-Shirts" },
  { label: "Shirts",   filter: "Shirts" },
  { label: "Panjabi",  filter: "Panjabi" },
  { label: "Dresses",  filter: "Dresses" },
  { label: "Shoes",    filter: "Shoes" },
];

export function FeaturedGrid() {
  const { t, lang } = useT();
  const [tab, setTab]           = useState<string | null>(null);
  const [allProducts, setAll]   = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    cachedJson<{ products: Product[] }>("/api/products?featured=true&limit=20")
      .then(({ products }) => setAll(products ?? []))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const items = tab
    ? allProducts.filter((p) => p.subcategory === tab)
    : allProducts;

  const display = items.slice(0, 5);

  // Admin-driven: no products marked "featured" → hide the whole section.
  if (!loading && allProducts.length === 0) return null;

  return (
    <section className="w-full min-w-0 overflow-x-clip">
      <div className="relative bg-secondary/40 pt-10 pb-16 sm:pt-12 sm:pb-20">
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 56" className="block w-full" preserveAspectRatio="none" style={{ height: 48 }}>
            <path d="M0,56 L0,28 Q360,0 720,28 Q1080,56 1440,28 L1440,56 Z" fill="white" className="fill-background" />
          </svg>
        </div>

        <div className={`relative mx-auto max-w-7xl px-4 lg:px-6 ${lang === "bn" ? "font-bn" : ""}`}>
          <div className="mb-6 flex flex-col sm:mb-8">
            <div className="inline-block rounded-full bg-background px-6 py-2 shadow-sm self-start">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent sm:text-xs">{t("sec.featured.eyebrow")}</p>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem]">
              {t("sec.featured.title")}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Handpicked styles from our latest collection</p>
          </div>

          <div className="no-scrollbar mb-6 flex items-center gap-2 overflow-x-auto pb-1 sm:mb-8">
            {TABS.map(({ label, filter }) => (
              <button
                key={label}
                type="button"
                onClick={() => setTab(filter)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                  tab === filter
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-background border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl -mt-12 px-4 pb-10 sm:-mt-14 lg:px-6 lg:pb-14">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : display.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No products found</div>
        ) : (
          <>
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:hidden">
              <div className="flex snap-x snap-mandatory gap-3 pb-2">
                {display.map((p) => (
                  <div key={p.id} className="w-[52vw] shrink-0 snap-start">
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden grid-cols-3 gap-4 sm:grid md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
              {display.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/category/fashion?filter=featured"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-foreground hover:text-background"
          >
            {t("sec.viewall")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
