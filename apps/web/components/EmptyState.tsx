export function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-ink-800/40 rounded-xl p-12 text-center text-sm text-ink-600 bg-white/60 shadow-soft">
      {text}
    </div>
  );
}
