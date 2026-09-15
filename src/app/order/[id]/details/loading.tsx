import { OrderDetailPanelSkeleton } from "@/components/site/skeletons";

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <OrderDetailPanelSkeleton />
    </div>
  );
}

