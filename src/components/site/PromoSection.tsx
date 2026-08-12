"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PromoBanner } from "@/lib/content-types";

// Static fallback (shown until localStorage is read)
const FALLBACK_BANNERS: PromoBanner[] = [
  {
    id: "f1", eyebrow: "Premium",
    title: "Skincare & Beauty\nEssentials", subtitle: "Get Extra 30% Off",
    image: "https://images.unsplash.com/photo-1591130901921-3f0652bb3915?auto=format&fit=crop&w=480&h=480&q=80",
    href: "/category/beauty", bg: "#e8f5f0", active: true, order: 0,
  },
  {
    id: "f2", eyebrow: "Premium",
    title: "Healthy Food Habits\nfor Everyday Life", subtitle: "Get Extra 50% Off",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=480&h=480&q=80",
    href: "/category/grocery", bg: "#fff9e6", active: true, order: 1,
  },
  {
    id: "f3", eyebrow: "New Arrival",
    title: "Smart Gadgets\nfor Modern Life", subtitle: "Up to 40% Off",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=480&h=480&q=80",
    href: "/category/gadgets", bg: "#eef2ff", active: true, order: 2,
  },
  {
    id: "f4", eyebrow: "Trending",
    title: "Fashion Made\nfor You", subtitle: "New styles every week",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=480&h=480&q=80",
    href: "/category/fashion", bg: "#fdf2f0", active: true, order: 3,
  },
];

export function PromoSection() {
  const [banners, setBanners] = useState<PromoBanner[] | null>(null);

  useEffect(() => {
    fetch("/api/promo-banners")
      .then((r) => r.json())
      .then((data) => setBanners(Array.isArray(data) ? data : []))
      .catch(() => setBanners([]));
  }, []);

  // Admin-driven: no promo banners set → hide the section (no hardcoded fallback).
  if (!banners || banners.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10 lg:px-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {banners.slice(0, 4).map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="group relative flex min-h-[190px] sm:min-h-[220px] overflow-hidden rounded-2xl p-6 sm:p-7"
            style={{ backgroundColor: c.bg }}
          >
            {/* Text */}
            <div className="relative z-10 flex flex-col justify-between h-full max-w-[55%]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/50 mb-2">
                  {c.eyebrow}
                </p>
                <h3 className="text-[17px] sm:text-[19px] font-bold leading-snug tracking-tight text-foreground whitespace-pre-line">
                  {c.title}
                </h3>
                <p className="mt-2 text-[13px] font-semibold text-foreground/60">
                  {c.subtitle}
                </p>
              </div>
              <div className="mt-5">
                <span className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-bold px-4 py-2.5 rounded-full transition-all group-hover:bg-accent group-hover:gap-3">
                  Shop Now
                  <span className="size-5 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowUpRight className="size-3" />
                  </span>
                </span>
              </div>
            </div>

            {/* Product image */}
            {c.image && (
              <div className="absolute right-0 bottom-0 h-[85%] w-[48%] pointer-events-none">
                <img
                  src={c.image}
                  alt={c.title.replace("\n", " ")}
                  className="w-full h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-[1.04] group-hover:-translate-y-1"
                  loading="lazy"
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
