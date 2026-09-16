"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { HeroSlide } from "@/lib/content-types";
import { HeroSkeleton } from "./skeletons";
import { cachedJson } from "@/lib/api-cache";

const FALLBACK_HERO_IMG =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop";

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    cachedJson<HeroSlide[]>("/api/hero-slides", { persistent: false, ttlMs: 0 })
      .then((data) => setSlides(Array.isArray(data) ? data : []))
      .catch(() => setSlides([]));
  }, []);

  const total = slides?.length ?? 0;
  const next = useCallback(() => setI((p) => (p + 1) % Math.max(total, 1)), [total]);
  const prev = useCallback(() => setI((p) => (p - 1 + Math.max(total, 1)) % Math.max(total, 1)), [total]);

  useEffect(() => {
    if (paused || total === 0) return;
    const tm = setInterval(next, 5500);
    return () => clearInterval(tm);
  }, [next, paused, total]);

  if (slides === null) return <HeroSkeleton />;
  if (slides.length === 0) return null;

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl overflow-x-clip px-4 pt-4 sm:pt-6">
      <div
        className="relative h-[200px] w-full overflow-hidden rounded-3xl bg-neutral-900 min-[380px]:h-[220px] min-[440px]:h-[240px] sm:h-[320px] md:h-[420px] lg:min-h-[560px] lg:h-auto"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((s, idx) => {
          const title = s.title?.trim() ?? "";
          const slug = s.slug?.trim() ?? "";
          const cta = s.cta?.trim() ?? "";
          const hasOverlayContent = Boolean(s.badge || title || s.subtitle || cta);
          const href = slug ? `/category/${encodeURIComponent(slug)}` : "#";

          return (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${idx === i ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <img
                src={s.image || FALLBACK_HERO_IMG}
                alt={title || "Hero banner"}
                className={`absolute inset-0 size-full object-cover transition-transform duration-[6000ms] ease-out ${idx === i ? "scale-105" : "scale-100"}`}
              />
              {hasOverlayContent && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent" />
              )}

              <div className="relative z-10 flex h-full items-center">
                <div className="max-w-lg px-4 py-5 sm:px-12 sm:py-10 lg:px-16">
                  {s.badge && (
                    <span className="inline-flex items-center rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white sm:text-xs">
                      {s.badge}
                    </span>
                  )}
                  {title && (
                    <h1 className="mt-5 text-3xl font-extrabold leading-[1.05] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
                      {title}
                    </h1>
                  )}
                  {s.subtitle && (
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
                      {s.subtitle}
                    </p>
                  )}
                  {cta && (
                    <Link
                      href={href}
                      className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-neutral-900 shadow-lg transition hover:bg-accent hover:text-white active:scale-[0.98] sm:h-[3.25rem] sm:text-[15px]"
                    >
                      {cta}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-2.5 top-1/2 z-20 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30 min-[360px]:flex sm:left-4 sm:size-11"
        >
          <ChevronLeft className="size-4 sm:size-5" />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-2.5 top-1/2 z-20 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30 min-[360px]:flex sm:right-4 sm:size-11"
        >
          <ChevronRight className="size-4 sm:size-5" />
        </button>

        <div className="absolute bottom-3 left-4 z-20 flex items-center gap-1.5 sm:bottom-5 sm:left-12 sm:gap-2 lg:left-16">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setI(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${idx === i ? "w-8 bg-accent" : "w-2 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
