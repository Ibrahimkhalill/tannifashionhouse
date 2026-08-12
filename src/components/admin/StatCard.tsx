import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: "blue" | "green" | "orange" | "purple" | "red" | "yellow" | "teal" | "pink";
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   text: "text-blue-700" },
  green:  { bg: "bg-green-50",  icon: "bg-green-100 text-green-600",  text: "text-green-700" },
  orange: { bg: "bg-orange-50", icon: "bg-orange-100 text-orange-600",text: "text-orange-700" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600",text: "text-purple-700" },
  red:    { bg: "bg-red-50",    icon: "bg-red-100 text-red-600",      text: "text-red-700" },
  yellow: { bg: "bg-yellow-50", icon: "bg-yellow-100 text-yellow-600",text: "text-yellow-700" },
  teal:   { bg: "bg-teal-50",   icon: "bg-teal-100 text-teal-600",    text: "text-teal-700" },
  pink:   { bg: "bg-pink-50",   icon: "bg-pink-100 text-pink-600",    text: "text-pink-700" },
};

export function StatCard({ title, value, subtitle, icon: Icon, color }: Props) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-2xl p-5 flex items-start justify-between gap-4`}>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`${c.icon} rounded-xl p-2.5 shrink-0`}>
        <Icon className="size-5" strokeWidth={2} />
      </div>
    </div>
  );
}
