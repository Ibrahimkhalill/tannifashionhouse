"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, RotateCcw, Plus, X, Check, Save } from "lucide-react";
import { toast } from "sonner";
import type { ShippingPolicy, PolicySection } from "@/lib/shipping-policy";
import { AdminCardGridSkeleton } from "@/components/admin/AdminSkeletons";

type SectionKey = "delivery" | "returns";

const SECTION_META: Record<SectionKey, { icon: typeof Truck; hint: string }> = {
  delivery: { icon: Truck,    hint: "Shipping cost, timing, coverage" },
  returns:  { icon: RotateCcw, hint: "Return window, conditions, refunds" },
};

export default function ShippingPolicyPage() {
  const [policy, setPolicy] = useState<ShippingPolicy | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/shipping-policy")
      .then((r) => r.json())
      .then((d) => setPolicy(d.policy ?? null))
      .catch(() => toast.error("Failed to load policy"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const patchSection = (key: SectionKey, patch: Partial<PolicySection>) =>
    setPolicy((p) => (p ? { ...p, [key]: { ...p[key], ...patch } } : p));

  const setItem = (key: SectionKey, i: number, val: string) =>
    setPolicy((p) => {
      if (!p) return p;
      const items = [...p[key].items];
      items[i] = val;
      return { ...p, [key]: { ...p[key], items } };
    });

  const addItem = (key: SectionKey) =>
    setPolicy((p) => (p && p[key].items.length < 8 ? { ...p, [key]: { ...p[key], items: [...p[key].items, ""] } } : p));

  const removeItem = (key: SectionKey, i: number) =>
    setPolicy((p) => (p ? { ...p, [key]: { ...p[key], items: p[key].items.filter((_, idx) => idx !== i) } } : p));

  const handleSave = async () => {
    if (!policy) return;
    setSaving(true);
    const res = await fetch("/api/admin/shipping-policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to save"); return; }
    const d = await res.json();
    setPolicy(d.policy); // reflect normalized (trimmed / empties dropped) result
    toast.success("Shipping & returns updated");
  };

  if (!policy) return <AdminCardGridSkeleton cards={2} cols="lg:grid-cols-2" />;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Shipping &amp; Returns</h2>
          <p className="text-sm text-slate-400">Shown on every product page&apos;s &ldquo;Shipping &amp; returns&rdquo; tab</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 h-10 px-5 bg-[#ef4444] hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition shrink-0">
          <Save className="size-4" /> {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* Editors */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(["delivery", "returns"] as const).map((key) => {
          const section = policy[key];
          const Meta = SECTION_META[key];
          return (
            <div key={key} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="size-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <Meta.icon className="size-5 text-[#ef4444]" />
                </span>
                <div className="min-w-0">
                  <input
                    value={section.title}
                    onChange={(e) => patchSection(key, { title: e.target.value })}
                    className="w-full font-semibold text-slate-800 outline-none border-b border-transparent focus:border-slate-300 transition"
                    placeholder="Section title"
                  />
                  <p className="text-xs text-slate-400 mt-0.5">{Meta.hint}</p>
                </div>
              </div>

              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-500 shrink-0" />
                    <input
                      value={item}
                      onChange={(e) => setItem(key, i, e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400 transition"
                      placeholder="Policy line…"
                    />
                    <button onClick={() => removeItem(key, i)} aria-label="Remove line"
                      className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition shrink-0">
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>

              {section.items.length < 8 && (
                <button onClick={() => addItem(key)}
                  className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#ef4444] transition">
                  <Plus className="size-4" /> Add line
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Live preview — mirrors the storefront tab */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Storefront preview</p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
          {(["delivery", "returns"] as const).map((key) => {
            const section = policy[key];
            const Meta = SECTION_META[key];
            return (
              <div key={key} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="size-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <Meta.icon className="size-5 text-[#ef4444]" />
                  </span>
                  <h3 className="font-semibold text-slate-800">{section.title || "Untitled"}</h3>
                </div>
                <ul className="space-y-2.5">
                  {section.items.filter((i) => i.trim()).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                      <Check className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
