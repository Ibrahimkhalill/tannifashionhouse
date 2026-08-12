/* ────────────────────────────────────────────────────────────────────
   Admin shimmer skeletons — light, slate-toned placeholders that mirror
   the admin panel's table/card/dashboard layouts so content swaps in
   without layout shift. Uses the shared `.skeleton-shimmer` sweep.
   ──────────────────────────────────────────────────────────────────── */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} />;
}

/** Page header: title + subtitle + optional action button. */
export function AdminHeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Bar className="h-7 w-40" />
        <Bar className="mt-2 h-3.5 w-56" />
      </div>
      {action && <Bar className="h-10 w-32 rounded-xl" />}
    </div>
  );
}

/** A table card placeholder: header row + N body rows. */
export function AdminTableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3.5">
        {Array.from({ length: cols }).map((_, i) => (
          <Bar key={i} className={`h-3 ${i === 0 ? "w-40" : "w-20"}`} />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Bar className="size-11 shrink-0 rounded-xl" />
              <div>
                <Bar className="h-4 w-36" />
                <Bar className="mt-1.5 h-3 w-20" />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-6">
              {Array.from({ length: Math.max(1, cols - 2) }).map((_, i) => (
                <Bar key={i} className="hidden h-4 w-16 sm:block" />
              ))}
              <Bar className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shimmer rows that live inside an existing <tbody> (keeps table chrome). */
export function AdminTableRowsSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Bar className="size-10 shrink-0 rounded-xl" />
              <div>
                <Bar className="h-4 w-32" />
                <Bar className="mt-1.5 h-3 w-16" />
              </div>
            </div>
          </td>
          {Array.from({ length: Math.max(0, cols - 1) }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <Bar className="h-4 w-16" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** A full table page: header + filter bar + table. */
export function AdminTablePageSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <AdminHeaderSkeleton />
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <Bar className="h-10 w-full max-w-sm rounded-xl" />
      </div>
      <AdminTableSkeleton rows={rows} cols={cols} />
    </div>
  );
}

/** A responsive grid of card placeholders (colors, badges, banners, promos). */
export function AdminCardGridSkeleton({ cards = 8, cols = "sm:grid-cols-3 lg:grid-cols-4" }: { cards?: number; cols?: string }) {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <AdminHeaderSkeleton />
      <div className={`grid grid-cols-2 gap-4 ${cols}`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
            <Bar className="mx-auto size-14 rounded-full" />
            <Bar className="mx-auto mt-3 h-4 w-20" />
            <Bar className="mx-auto mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Product/entity form: stepper + two-column content + preview rail. */
export function AdminFormSkeleton() {
  return (
    <div className="mx-auto max-w-6xl pb-12">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bar className="size-9 rounded-xl" />
          <div>
            <Bar className="h-3 w-24" />
            <Bar className="mt-1.5 h-5 w-40" />
          </div>
        </div>
        <Bar className="h-10 w-28 rounded-xl" />
      </div>
      <Bar className="mb-6 h-16 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <Bar className="h-6 w-56" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Bar className="h-3.5 w-28" />
              <Bar className="mt-2 h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="hidden lg:block">
          <Bar className="aspect-square w-full rounded-2xl" />
          <Bar className="mt-4 h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Dashboard: stat cards + charts + recent table. */
export function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Bar className="h-7 w-52" />
        <Bar className="mt-2 h-3.5 w-72" />
      </div>
      {/* stat rows */}
      {Array.from({ length: 2 }).map((_, r) => (
        <div key={r} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Bar className="size-10 rounded-xl" />
              <Bar className="mt-4 h-6 w-24" />
              <Bar className="mt-2 h-3 w-16" />
            </div>
          ))}
        </div>
      ))}
      {/* charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <Bar className="h-5 w-40" />
          <Bar className="mt-4 h-56 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Bar className="h-5 w-32" />
          <Bar className="mx-auto mt-6 size-40 rounded-full" />
        </div>
      </div>
      <AdminTableSkeleton rows={5} cols={6} />
    </div>
  );
}
