import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────
   Shimmer skeleton library — every placeholder mirrors the exact
   dimensions of the component it stands in for, so content swaps in
   without layout shift.
   ──────────────────────────────────────────────────────────────────── */

/** Matches ProductCard: 1:1 image, category line, 2-line title, swatches, price. */
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border/70 bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col p-3.5 lg:p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
        <div className="mt-2.5 flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="size-4 rounded-full" />
          ))}
        </div>
        <div className="mt-auto pt-3.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-3 h-10 w-full rounded-xl lg:hidden" />
        </div>
      </div>
    </div>
  );
}

/** Responsive grid of product card skeletons. */
export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Matches HeroSlider: full-width rounded banner with text + image sides. */
export function HeroSkeleton() {
  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl overflow-x-clip px-4 pt-4 sm:pt-6">
      <div className="relative min-h-[480px] w-full overflow-hidden rounded-2xl sm:min-h-[520px] md:min-h-[540px] md:rounded-3xl skeleton-shimmer">
        <div className="grid h-full min-h-[480px] grid-cols-1 items-center sm:min-h-[520px] md:min-h-[540px] md:grid-cols-2">
          <div className="order-1 flex h-52 items-center justify-center md:order-none md:h-full">
            <div className="size-56 rounded-full bg-foreground/5 md:size-80" />
          </div>
          <div className="px-6 py-8 md:px-14 md:py-0">
            <div className="h-7 w-32 rounded-full bg-foreground/10" />
            <div className="mt-5 h-10 w-3/4 max-w-sm rounded-lg bg-foreground/10" />
            <div className="mt-3 h-10 w-1/2 max-w-xs rounded-lg bg-foreground/10" />
            <div className="mt-5 h-4 w-2/3 max-w-xs rounded bg-foreground/5" />
            <div className="mt-8 h-12 w-40 rounded-full bg-foreground/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Section heading: eyebrow + title. */
export function SectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-56 sm:h-9" />
    </div>
  );
}

/** Matches CategoryStrip: header + 6 circular category tiles. */
export function CategoryStripSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-8 sm:pt-12 lg:px-6">
      <SectionHeaderSkeleton />
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center rounded-2xl border border-border bg-card">
            <div className="flex w-full flex-col items-center gap-2 px-2 py-4 sm:py-5">
              <Skeleton className="size-14 rounded-full sm:size-18" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Matches SubcategorySection: header row + 6 landscape cards. */
export function SubcategoryCardsSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="mt-2 h-8 w-44 sm:h-9" />
        </div>
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-4/3 w-full rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

/** Generic page-header placeholder (breadcrumb + title). */
export function PageHeaderSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 lg:px-6">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-9 w-64" />
      <Skeleton className="mt-2 h-4 w-48" />
    </div>
  );
}

/** A stack of horizontal list rows (cart items, orders, addresses). */
export function ListRowsSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <Skeleton className="size-20 shrink-0 rounded-lg sm:size-24" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/3" />
            <Skeleton className="mt-3 h-5 w-24" />
          </div>
          <Skeleton className="hidden h-9 w-24 rounded-lg sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Product detail page: gallery + info column. */
export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6 lg:py-10">
      <Skeleton className="h-3 w-56" />
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        </div>
        {/* Info */}
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-9 w-4/5" />
          <Skeleton className="mt-2 h-9 w-3/5" />
          <Skeleton className="mt-5 h-7 w-36" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <div className="mt-6 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-10 rounded-full" />
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-14 rounded-lg" />
            ))}
          </div>
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Order tracking page: summary card + delivery timeline. */
export function OrderTrackingSkeleton() {
  return (
    <div className="bg-secondary/20 min-h-screen pb-16">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        {/* top link */}
        <Skeleton className="h-4 w-32" />

        {/* summary card */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="mt-2 h-5 w-40" />
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <div className="flex -space-x-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="size-10 rounded-xl" />
              ))}
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-1.5 h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        </div>

        {/* timeline card */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <Skeleton className="mb-6 h-5 w-40" />
          <div className="flex flex-col gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 pt-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* actions */}
        <div className="flex justify-end gap-3">
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Order details page (inside ProfileShell): timeline + address + items + summary. */
export function OrderDetailPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-1.5 h-4 w-40" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Category / search results: filter rail + product grid. */
export function CategoryPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
      <Skeleton className="h-3 w-48" />
      <Skeleton className="mt-4 h-9 w-56" />
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-6 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
                <Skeleton className="h-3.5 w-4/6" />
              </div>
            </div>
          ))}
        </div>
        <ProductGridSkeleton count={9} className="lg:grid-cols-3" />
      </div>
    </div>
  );
}
