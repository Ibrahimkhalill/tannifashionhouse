import { PageHeaderSkeleton } from "@/components/site/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrackLoading() {
  return (
    <main className="min-h-screen">
      <PageHeaderSkeleton />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
      </div>
    </main>
  );
}
