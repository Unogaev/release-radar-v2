"use client";
import { tokens } from "./tokens";
export function EmptyState({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[16px] border p-8 text-center" style={{ borderColor: tokens.color.border, backgroundColor: tokens.color.surface }}>
      <div className="mb-3" style={{ color: tokens.color.textTertiary }}>{icon}</div>
      <div className="text-[14px]" style={{ color: tokens.color.textSecondary }}>{title}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
