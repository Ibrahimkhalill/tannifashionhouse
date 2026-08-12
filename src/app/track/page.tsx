"use client";

import { useRouter } from "next/navigation";
import { Layout } from "@/components/site/Layout";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Search } from "lucide-react";

function TrackPage() {
  const router = useRouter();
  const [oid, setOid] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = oid.trim();
    if (!id) { toast.error("Enter your order ID"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
      if (!res.ok) {
        toast.error("Order not found", { description: "Check your order ID and try again." });
        return;
      }
      router.push(`/order/${id}`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout hideTrust>
      <div className="flex min-h-screen w-full min-w-0 flex-col items-center justify-start bg-secondary/20 px-4 pt-20 pb-16">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
          <Package size={28} className="text-foreground" strokeWidth={1.75} />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-extrabold text-foreground text-center">Order Tracking</h1>
        <p className="mt-3 text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
          Enter your order ID to see the current status and detailed tracking information for your shipment.
        </p>

        {/* Order ID lookup */}
        <form onSubmit={submit} className="mt-8 w-full min-w-0 max-w-lg">
          <div className="flex w-full min-w-0 items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-4 pr-1.5 shadow-sm transition focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
            <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={oid}
              onChange={(e) => setOid(e.target.value)}
              placeholder="Order ID (e.g. BD-2026-12345)"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Track order"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <Search size={16} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default TrackPage;
