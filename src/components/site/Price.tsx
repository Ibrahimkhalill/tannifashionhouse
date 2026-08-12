import TakaSvg from "@/assets/TakaSvg";
import { cn } from "@/lib/utils";

export type PriceSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl";

interface PriceProps {
  amount: number;
  /** Extra classes on the wrapper. Overrides default size classes when conflicting. */
  className?: string;
  /** Extra classes on the symbol (use to override per-breakpoint size). */
  symbolClassName?: string;
  /** Base size preset (responsive overrides go through className/symbolClassName). */
  size?: PriceSize;
  /** Muted, lighter weight color (used for old / strikethrough prices). */
  muted?: boolean;
  /** Adds line-through and slight opacity. */
  struck?: boolean;
  /** Use "inherit" to let the price inherit color from the parent (white text, accent text, etc.). */
  tone?: "default" | "inherit";
}

/**
 * Symbol is sized to ~72-75% of the amount font-size for perfect optical balance,
 * regardless of preset. Vertical alignment uses baseline + 1px nudge so the
 * Taka glyph sits cleanly against the number.
 */
const sizeMap: Record<PriceSize, { wrap: string; sym: string }> = {
  xs:    { wrap: "text-xs",            sym: "text-[0.55rem]" },
  sm:    { wrap: "text-sm",            sym: "text-[0.65rem]" },
  md:    { wrap: "text-base",          sym: "text-[0.78rem]" },
  lg:    { wrap: "text-lg",            sym: "text-[0.88rem]" },
  xl:    { wrap: "text-xl",            sym: "text-[1rem]"    },
  "2xl": { wrap: "text-2xl",           sym: "text-[1.15rem]" },
  "3xl": { wrap: "text-[1.875rem]",    sym: "text-[1.35rem]" },
  "4xl": { wrap: "text-[2.25rem]",     sym: "text-[1.6rem]"  },
};

export function Price({
  amount,
  className,
  symbolClassName,
  size = "md",
  muted = false,
  struck = false,
  tone = "default",
}: PriceProps) {
  const { wrap, sym } = sizeMap[size];

  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-baseline gap-[3px] font-bold tabular-nums",
        wrap,
        tone === "default" && !muted && "text-foreground",
        muted && "text-muted-foreground",
        struck && "line-through opacity-80",
        className,
      )}
    >
      <span className="sr-only">Taka </span>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex font-medium leading-none translate-y-[1px]",
          sym,
          muted ? "opacity-65" : "opacity-75",
          symbolClassName,
        )}
      >
        <TakaSvg />
      </span>
      <span className="leading-none tracking-tight">{amount.toLocaleString()}</span>
    </span>
  );
}
