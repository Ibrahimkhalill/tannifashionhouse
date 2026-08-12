"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import heroImg from "@/assets/hero-shopping.png";
import type { HeroSlide } from "@/lib/content-types";
import { HeroSkeleton } from "./skeletons";

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [i, setI]           = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("/api/hero-slides")
      .then((r) => r.json())
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
        className="relative min-h-[420px] w-full overflow-hidden rounded-3xl bg-neutral-900 sm:min-h-[500px] lg:min-h-[560px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Editorial cover banners — full-bleed fashion image + readable scrim */}
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${idx === i ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            <img
              src={s.image || heroImg.src}
              alt={s.title}
              className={`absolute inset-0 size-full object-cover transition-transform duration-[6000ms] ease-out ${idx === i ? "scale-105" : "scale-100"}`}
            />
            {/* Left-to-right dark scrim so text stays legible over any photo */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:hidden" />

            {/* Text panel */}
            <div className="relative z-10 flex h-full min-h-[420px] items-center sm:min-h-[500px] lg:min-h-[560px]">
              <div className="max-w-lg px-6 py-10 sm:px-12 lg:px-16">
                {s.badge && (
                  <span className="inline-flex items-center rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white sm:text-xs">
                    {s.badge}
                  </span>
                )}
                <h1 className="mt-5 text-3xl font-extrabold leading-[1.05] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
                  {s.title}
                </h1>
                {s.subtitle && (
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
                    {s.subtitle}
                  </p>
                )}
                <Link
                  href={`/category/${s.slug}`}
                  className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-neutral-900 shadow-lg transition hover:bg-accent hover:text-white active:scale-[0.98] sm:h-[3.25rem] sm:text-[15px]"
                >
                  {s.cta || "Shop Now"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Nav arrows */}
        <button onClick={prev} aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 sm:flex">
          <ChevronLeft className="size-5" />
        </button>
        <button onClick={next} aria-label="Next slide"
          className="absolute right-4 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 sm:flex">
          <ChevronRight className="size-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-6 z-20 flex items-center gap-2 sm:left-12 lg:left-16">
          {slides.map((s, idx) => (
            <button key={s.id} onClick={() => setI(idx)} aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${idx === i ? "w-8 bg-accent" : "w-2 bg-white/40 hover:bg-white/70"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
