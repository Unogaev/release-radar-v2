"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { FeedPayload } from "@/lib/radar/types";
import { RadarFeed } from "@/components/radar/RadarFeed";
import type { SignalAction } from "@/components/radar/parts";

export function RadarFeedClient({
  payload,
  isStale,
}: {
  payload: FeedPayload;
  isStale: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (id: string, action: SignalAction) => {
    switch (action) {
      case "buy":
        break;
      case "source":
        router.push(`/signals/${id}`);
        break;
      case "calendar":
        router.push(`/calendar?signal=${encodeURIComponent(id)}`);
        break;
      case "publish":
        break;
    }
  };

  return (
    <RadarFeed
      payload={payload}
      isStale={isStale}
      isPending={isPending}
      onRetry={() => startTransition(() => router.refresh())}
      onAction={handleAction}
    />
  );
}
