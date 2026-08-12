import { HeroSkeleton, CategoryStripSkeleton, ProductGridSkeleton } from "@/components/site/skeletons";

export default function HomeLoading() {
  return (
    <main className="min-h-screen">
      <HeroSkeleton />
      <CategoryStripSkeleton />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6">
        <ProductGridSkeleton count={8} className="sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" />
      </div>
    </main>
  );
}
