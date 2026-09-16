export function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-ink-700 rounded-lg p-10 text-center text-sm text-ink-600">
      {text}
    </div>
  );
}
