import { Truck, Banknote, RotateCcw, Headphones } from "lucide-react";
import { useT, dict } from "@/lib/i18n";

const items: {
  icon: React.ElementType;
  t: keyof typeof dict;
  d: keyof typeof dict;
  iconBg: string;
  iconFg: string;
}[] = [
  { icon: Truck,       t: "trust.delivery.title", d: "trust.delivery.desc", iconBg: "bg-accent/10", iconFg: "text-accent" },
  { icon: Banknote,    t: "trust.secure.title",   d: "trust.secure.desc",   iconBg: "bg-black",      iconFg: "text-white" },
  { icon: RotateCcw,   t: "trust.returns.title",  d: "trust.returns.desc",  iconBg: "bg-accent/10", iconFg: "text-accent" },
  { icon: Headphones,  t: "trust.support.title",  d: "trust.support.desc",  iconBg: "bg-black",      iconFg: "text-white" },
];

export function TrustStrip() {
  const { t, lang } = useT();
  return (
    <section className="w-full min-w-0 overflow-x-clip bg-background py-6 sm:py-10">
      <div className={`mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 md:grid-cols-4 md:gap-5 lg:px-6 ${lang === "bn" ? "font-bn" : ""}`}>
        {items.map(({ icon: Icon, t: tk, d, iconBg, iconFg }) => (
          <div
            key={tk}
            className="flex flex-col items-center rounded-2xl border border-border/60 bg-card px-4 py-5 text-center shadow-sm transition hover:shadow-md sm:py-7"
          >
            <span className={`mb-3 flex size-12 items-center justify-center rounded-full ${iconBg} sm:size-14`}>
              <Icon className={`size-5 sm:size-6 ${iconFg}`} />
            </span>
            <p className="text-[13px] font-bold leading-tight sm:text-sm">{t(tk)}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">{t(d)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
