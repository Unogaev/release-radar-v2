export function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-rr-hair/40 rounded-xl p-12 text-center text-sm text-rr-text-dim bg-rr-surface/60 shadow-soft">
      {text}
    </div>
  );
}
