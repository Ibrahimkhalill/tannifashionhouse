"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Product } from "./ProductCard";
import { useT } from "@/lib/i18n";

export function TrendingSection() {
  const { t, lang } = useT();
  const [items, setItems]   = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?trending=true&limit=5")
      .then((r) => r.json())
      .then(({ products }) =>
        setItems(
          (products ?? []).slice(0, 5).map((p: Product) => ({
            ...p,
            badge: { label: t("badge.trending"), tone: "trending" as const },
          })),
        ),
      )
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [t]);

  // Admin-driven: no trending products marked → hide the whole section.
  if (!loading && items.length === 0) return null;

  return (
    <section className="w-full min-w-0 overflow-x-clip">
      <div className="relative pt-10 pb-16 sm:pt-12 sm:pb-20" style={{ background: "oklch(0.95 0 0)" }}>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 56" className="block w-full" preserveAspectRatio="none" style={{ height: 48 }}>
            <path d="M0,28 Q360,56 720,28 Q1080,0 1440,28 L1440,56 L0,56 Z" fill="white" className="fill-background" />
          </svg>
        </div>
        <div className={`relative mx-auto max-w-7xl px-4 lg:px-6 ${lang === "bn" ? "font-bn" : ""}`}>
          <div className="mb-6 flex flex-col sm:mb-8">
            <div className="inline-block rounded-full bg-background px-6 py-2 shadow-sm self-start">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent sm:text-xs">{t("sec.trending.eyebrow")}</p>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem]">{t("sec.trending.title")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Hottest picks right now 🔥</p>
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
        ) : (
          <>
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:hidden">
              <div className="flex snap-x snap-mandatory gap-3 pb-2">
                {items.map((p) => (
                  <div key={p.id} className="w-[52vw] shrink-0 snap-start">
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden grid-cols-3 gap-4 sm:grid md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </>
        )}
        <div className="mt-8 flex justify-center">
          <Link
            href="/search?sort=new"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-foreground hover:text-background"
          >
            {t("sec.viewall")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
