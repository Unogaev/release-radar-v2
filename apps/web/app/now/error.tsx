"use client";

import { FeedError } from "@/components/radar/states";

export default function NowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-rr-bg pt-[104px]">
      <FeedError reason={error.message} onRetry={reset} />
    </div>
  );
}
