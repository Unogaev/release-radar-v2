import { LucideIcon } from "lucide-react";

export function KpiTile({
  icon: Icon,
  label,
  value,
  accent,
  small,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: string;
  small?: boolean;
}) {
  return (
    <div className="border border-graphite-700 rounded-xl p-3 bg-graphite-900">
      <div className="flex items-center gap-1.5 text-graphite-500 text-[11px] uppercase tracking-wide">
        <Icon size={12} />
        {label}
      </div>
      <div className={`mt-1.5 font-semibold tabular-nums ${small ? "text-sm" : "text-xl"} ${accent ?? "text-graphite-100"}`}>
        {value}
      </div>
    </div>
  );
}
