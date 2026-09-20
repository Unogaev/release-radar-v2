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
    <div className="border border-rr-frame rounded-xl p-3 bg-rr-surface">
      <div className="flex items-center gap-1.5 text-rr-muted text-[11px] uppercase tracking-wide">
        <Icon size={12} />
        {label}
      </div>
      <div className={`mt-1.5 font-semibold tabular-nums ${small ? "text-sm" : "text-xl"} ${accent ?? "text-rr-text"}`}>
        {value}
      </div>
    </div>
  );
}
