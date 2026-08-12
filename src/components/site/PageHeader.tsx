"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type Crumb = { label: string; to?: string };

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  badge?: ReactNode;
  centered?: boolean;
  /** Optional tint color for the wave bg — defaults to secondary/40 */
  color?: string;
}

const crumbNav = "flex items-center gap-1.5 text-xs leading-none text-muted-foreground flex-wrap";
const pageTitleCentered = "text-[1.375rem] font-bold leading-tight tracking-tight text-balance sm:text-2xl lg:text-[1.75rem]";
const pageTitleDefault  = "text-[1.125rem] font-bold leading-tight tracking-tight text-balance sm:text-[1.25rem] lg:text-2xl";
const subtitleClass     = "text-[13px] text-muted-foreground leading-relaxed text-pretty lg:text-sm";

export function PageHeader({ title, subtitle, crumbs, actions, badge, centered, color }: PageHeaderProps) {
  /* ── Centered variant — Sellzy-style wave curve ── */
  if (centered) {
    const bg = color ?? "oklch(0.96 0 0)"; // neutral light grey
    return (
      <div className="relative w-full min-w-0 overflow-x-clip">
        {/* Colored band */}
        <div className="relative pb-12 pt-8 sm:pb-14 sm:pt-10" style={{ background: bg }}>
          <div className="mx-auto max-w-7xl px-4 text-center">
            {/* Breadcrumbs */}
            {crumbs && crumbs.length > 0 && (
              <nav className={`${crumbNav} justify-center mb-3`}>
                {crumbs.map((c, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="size-3 shrink-0 opacity-50" />}
                    {c.to ? (
                      <Link href={c.to} className="hover:text-foreground transition-colors">
                        {c.label}
                      </Link>
                    ) : (
                      <span className="text-foreground font-medium">{c.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}

            {/* Eyebrow badge — white pill like Sellzy */}
            {badge && (
              <div className="mb-3 flex justify-center">{badge}</div>
            )}

            <h1 className={pageTitleCentered}>{title}</h1>

            {subtitle && (
              <p className={`mx-auto mt-2 max-w-md ${subtitleClass} lg:mt-2.5 lg:max-w-xl`}>
                {subtitle}
              </p>
            )}

            {actions && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:mt-5">
                {actions}
              </div>
            )}
          </div>

          {/* SVG wave — white curve cut into the coloured band */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
            <svg
              viewBox="0 0 1440 56"
              className="block w-full"
              preserveAspectRatio="none"
              style={{ height: 48 }}
              aria-hidden
            >
              <path
                d="M0,56 L0,28 Q360,0 720,28 Q1080,56 1440,28 L1440,56 Z"
                fill="white"
                className="fill-background"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  /* ── Default (left-aligned) variant — keeps subtle gradient ── */
  return (
    <div className="border-b border-border/80 bg-linear-to-b from-secondary/50 to-background">
      <div className="mx-auto max-w-7xl px-4 pt-5 pb-4 sm:pt-6 sm:pb-5 lg:pt-8 lg:pb-7">
        {crumbs && crumbs.length > 0 && (
          <nav className={`${crumbNav} mb-2.5 lg:mb-3`}>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3 shrink-0 opacity-60" />}
                {c.to ? (
                  <Link href={c.to} className="hover:text-foreground transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4 lg:gap-6">
          <div className="min-w-0">
            {badge && <div className="mb-2">{badge}</div>}
            <h1 className={pageTitleDefault}>{title}</h1>
            {subtitle && (
              <p className={`mt-1.5 max-w-xl ${subtitleClass} lg:mt-2 lg:max-w-2xl`}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:gap-3">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}
