"use client";

import { useState } from "react";
import { X, Ruler } from "lucide-react";
import { useEscapeClose } from "@/hooks/use-escape-close";

// Standard body-measurement chart (cm). Inches are derived so the two units
// always stay in sync. These are conventional apparel sizes — a real size guide
// is a reference table, not per-product data.
const CHART: { size: string; chest: number; waist: number; hips: number; length: number }[] = [
  { size: "XS",  chest: 86,  waist: 70, hips: 90,  length: 66 },
  { size: "S",   chest: 91,  waist: 75, hips: 95,  length: 68 },
  { size: "M",   chest: 97,  waist: 81, hips: 101, length: 70 },
  { size: "L",   chest: 102, waist: 86, hips: 106, length: 72 },
  { size: "XL",  chest: 107, waist: 91, hips: 111, length: 74 },
  { size: "XXL", chest: 112, waist: 96, hips: 116, length: 76 },
];

const COLS = ["chest", "waist", "hips", "length"] as const;

export function SizeGuideModal({
  open,
  onClose,
  activeSize,
}: {
  open: boolean;
  onClose: () => void;
  activeSize?: string;
}) {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  useEscapeClose(open, onClose);
  if (!open) return null;

  const fmt = (cm: number) => (unit === "cm" ? cm : Math.round(cm / 2.54));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in w-full max-w-lg overflow-hidden rounded-t-2xl bg-background shadow-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Ruler className="size-4.5 text-accent" strokeWidth={2} />
            <h3 className="text-base font-bold text-foreground">Size Guide</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          {/* Unit toggle */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Body measurements</p>
            <div className="inline-flex rounded-lg border border-border p-0.5">
              {(["cm", "in"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`h-7 rounded-md px-3 text-xs font-semibold uppercase transition ${
                    unit === u ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 text-left">
                  <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Size</th>
                  {COLS.map((c) => (
                    <th key={c} className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {CHART.map((row) => {
                  const isActive = activeSize?.toUpperCase() === row.size;
                  return (
                    <tr key={row.size} className={isActive ? "bg-accent/10" : "hover:bg-secondary/40"}>
                      <td className="px-3 py-2.5 font-bold text-foreground">
                        {row.size}
                        {isActive && <span className="ml-1.5 text-[10px] font-semibold text-accent">• yours</span>}
                      </td>
                      {COLS.map((c) => (
                        <td key={c} className="px-3 py-2.5 tabular-nums text-muted-foreground">
                          {fmt(row[c])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            All values are body measurements in {unit === "cm" ? "centimetres" : "inches"}, not garment dimensions.
          </p>

          {/* How to measure */}
          <div className="mt-5">
            <h4 className="text-sm font-bold text-foreground">How to measure</h4>
            <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
              <li><span className="font-semibold text-foreground">Chest:</span> measure around the fullest part, under the arms, keeping the tape level.</li>
              <li><span className="font-semibold text-foreground">Waist:</span> measure around the narrowest part of your natural waistline.</li>
              <li><span className="font-semibold text-foreground">Hips:</span> measure around the fullest part of your hips.</li>
              <li><span className="font-semibold text-foreground">Length:</span> from the shoulder seam straight down to the hem.</li>
            </ul>
            <p className="mt-3 rounded-lg bg-secondary/50 px-3 py-2 text-[12px] text-muted-foreground">
              Tip: if you&apos;re between two sizes, size up for a relaxed fit or down for a snug fit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
