import { PageHeaderSkeleton, ListRowsSkeleton } from "@/components/site/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderLoading() {
  return (
    <main className="min-h-screen">
      <PageHeaderSkeleton />
      <div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="mt-6">
          <ListRowsSkeleton rows={2} />
        </div>
      </div>
    </main>
  );
}
