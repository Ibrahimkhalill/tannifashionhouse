import { PageHeaderSkeleton, ProductGridSkeleton } from "@/components/site/skeletons";

export default function WishlistLoading() {
  return (
    <main className="min-h-screen">
      <PageHeaderSkeleton />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
        <ProductGridSkeleton count={8} />
      </div>
    </main>
  );
}
