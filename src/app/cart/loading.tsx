import { PageHeaderSkeleton, ListRowsSkeleton } from "@/components/site/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <main className="min-h-screen">
      <PageHeaderSkeleton />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-[1fr_360px] lg:px-6">
        <ListRowsSkeleton rows={3} />
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-6 h-12 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
