"use client";
import { tokens } from "./tokens";
import { ImageWithFallback } from "./ImageWithFallback";
export function ListRow({ image, title, subtitle, meta, action }: {
  image?: string | null;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4" style={{ minHeight: 72, borderBottom: `1px solid ${tokens.color.border}` }}>
      <ImageWithFallback src={image} alt={title} className="h-14 w-14 shrink-0 rounded-[12px]" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold" style={{ color: tokens.color.text }}>{title}</div>
        {subtitle && <div className="truncate text-[12px]" style={{ color: tokens.color.textSecondary }}>{subtitle}</div>}
      </div>
      {meta && <div className="shrink-0">{meta}</div>}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
