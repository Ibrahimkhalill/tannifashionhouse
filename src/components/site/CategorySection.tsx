"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { Product } from "./ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT, dict } from "@/lib/i18n";

const sectionColors: Record<string, string> = {
  fashion: "oklch(0.97 0 0)",
  gadgets: "oklch(0.95 0 0)",
  beauty:  "oklch(0.97 0 0)",
  home:    "oklch(0.95 0 0)",
  grocery: "oklch(0.97 0 0)",
};

const waveParity = (slug: string) => {
  let n = 0;
  for (let i = 0; i < slug.length; i++) n += slug.charCodeAt(i);
  return n % 2;
};

export function CategorySection({
  titleKey,
  eyebrowKey,
  slug,
  ids,
}: {
  titleKey: keyof typeof dict;
  eyebrowKey: keyof typeof dict;
  slug: string;
  ids?: string[];
}) {
  const { t, lang } = useT();
  const [items, setItems]     = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = ids?.length
      ? `/api/products?category=${slug}&limit=6`
      : `/api/products?category=${slug}&limit=6`;

    fetch(url)
      .then((r) => r.json())
      .then(({ products }) => setItems(products ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [slug, ids]);

  const bg = sectionColors[slug] ?? "oklch(0.97 0 0)";
  const waveD = waveParity(slug) === 0
    ? "M0,56 L0,28 Q360,0 720,28 Q1080,56 1440,28 L1440,56 Z"
    : "M0,28 Q360,56 720,28 Q1080,0 1440,28 L1440,56 L0,56 Z";

  return (
    <section className="w-full min-w-0 overflow-x-clip">
      <div className="relative pt-10 pb-16 sm:pt-12 sm:pb-20" style={{ background: bg }}>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 56" className="block w-full" preserveAspectRatio="none" style={{ height: 48 }}>
            <path d={waveD} fill="white" className="fill-background" />
          </svg>
        </div>
        <div className={`relative mx-auto max-w-7xl px-4 lg:px-6 ${lang === "bn" ? "font-bn" : ""}`}>
          <div className="flex flex-col">
            <div className="inline-block rounded-full bg-background px-6 py-2 shadow-sm self-start">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent sm:text-xs">{t(eyebrowKey)}</p>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem]">{t(titleKey)}</h2>
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
            href={`/category/${slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-foreground hover:text-background"
          >
            {t("sec.viewall")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
