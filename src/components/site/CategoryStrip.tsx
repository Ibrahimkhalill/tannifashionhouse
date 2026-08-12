"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useT, dict } from "@/lib/i18n";
import { CategoryStripSkeleton } from "./skeletons";
import type { AdminCategory } from "@/lib/content-types";
import gadgets from "@/assets/cat-gadgets.jpg";
import fashion from "@/assets/cat-fashion.jpg";
import home from "@/assets/cat-home.jpg";
import beauty from "@/assets/cat-beauty.jpg";
import grocery from "@/assets/cat-grocery.jpg";
import deals from "@/assets/cat-deals.jpg";
import type { StaticImageData } from "next/image";

type K = keyof typeof dict;

// Static fallback config
const STATIC_CATS: { slug: string; key: K; img: StaticImageData; bg: string; color: string }[] = [
  { key: "cat.gadgets", slug: "gadgets", img: gadgets, bg: "#dbeafe", color: "#3b82f6" },
  { key: "cat.fashion", slug: "fashion", img: fashion, bg: "#fce7f3", color: "#ec4899" },
  { key: "cat.home",    slug: "home",    img: home,    bg: "#ffedd5", color: "#f97316" },
  { key: "cat.beauty",  slug: "beauty",  img: beauty,  bg: "#f3e8ff", color: "#a855f7" },
  { key: "cat.grocery", slug: "grocery", img: grocery, bg: "#dcfce7", color: "#22c55e" },
  { key: "cat.deals",   slug: "deals",   img: deals,   bg: "#fee2e2", color: "#ef4444" },
];

// Map admin category slug → static fallback
const STATIC_BY_SLUG = Object.fromEntries(STATIC_CATS.map((c) => [c.slug, c]));

const DEFAULT_COLORS: Record<number, { bg: string; color: string }> = {
  0: { bg: "#dbeafe", color: "#3b82f6" },
  1: { bg: "#fce7f3", color: "#ec4899" },
  2: { bg: "#ffedd5", color: "#f97316" },
  3: { bg: "#f3e8ff", color: "#a855f7" },
  4: { bg: "#dcfce7", color: "#22c55e" },
  5: { bg: "#fee2e2", color: "#ef4444" },
};

export function CategoryStrip() {
  const { t, lang } = useT();
  const [adminCats, setAdminCats] = useState<AdminCategory[] | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/categories?parent=true")
      .then((r) => r.json())
      .then(({ categories }) => {
        const mapped: AdminCategory[] = (categories ?? []).map((c: { id: string; name: string; slug: string; parentId: string | null; image: string | null; status: string }) => ({
          id: c.id, name: c.name, slug: c.slug,
          parentId: c.parentId, image: c.image ?? "",
          status: "active" as const, createdAt: 0,
        }));
        setAdminCats(mapped.length > 0 ? mapped : null);
      })
      .catch(() => setAdminCats(null));
  }, []);

  // Still reading config — shimmer placeholder, no static→admin flash.
  if (adminCats === undefined) return <CategoryStripSkeleton />;

  // Admin categories available → render them
  if (adminCats && adminCats.length > 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 pt-8 sm:pt-12 lg:px-6">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent sm:text-xs mb-1">Categories</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem]">Shop By Category</h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
          {adminCats.slice(0, 6).map((cat, idx) => {
            const fallback = STATIC_BY_SLUG[cat.slug];
            const { bg, color } = fallback ?? DEFAULT_COLORS[idx % 6];
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group flex flex-col items-center rounded-2xl border border-border bg-card transition-all duration-300 hover:border-foreground/20 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex flex-col items-center gap-2 px-2 py-4 sm:py-5 w-full">
                  <div
                    className="relative size-14 overflow-hidden rounded-full ring-2 ring-transparent transition-all duration-300 group-hover:ring-foreground/20 sm:size-18"
                    style={{ backgroundColor: bg }}
                  >
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : fallback ? (
                      <Image
                        src={fallback.img}
                        alt={cat.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="72px"
                      />
                    ) : null}
                  </div>
                  <span
                    className={`text-[11px] font-bold text-center leading-tight sm:text-xs ${lang === "bn" ? "font-bn" : ""}`}
                    style={{ color }}
                  >
                    {cat.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  // Static fallback
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-8 sm:pt-12 lg:px-6">
      <div className="mb-6 sm:mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent sm:text-xs mb-1">Categories</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem]">Shop By Category</h2>
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
        {STATIC_CATS.map(({ key, slug, img, bg, color }) => (
          <Link
            key={slug}
            href={`/category/${slug}`}
            className="group flex flex-col items-center rounded-2xl border border-border bg-card transition-all duration-300 hover:border-foreground/20 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex flex-col items-center gap-2 px-2 py-4 sm:py-5 w-full">
              <div
                className="relative size-14 overflow-hidden rounded-full ring-2 ring-transparent transition-all duration-300 group-hover:ring-foreground/20 sm:size-18"
                style={{ backgroundColor: bg }}
              >
                <Image
                  src={img}
                  alt={t(key)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="72px"
                />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight sm:text-xs ${lang === "bn" ? "font-bn" : ""}`} style={{ color }}>
                {t(key)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
