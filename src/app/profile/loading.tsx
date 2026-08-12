import { PageHeaderSkeleton, ListRowsSkeleton } from "@/components/site/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main className="min-h-screen">
      <PageHeaderSkeleton />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-[260px_1fr] lg:px-6">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        <ListRowsSkeleton rows={3} />
      </div>
    </main>
  );
}
