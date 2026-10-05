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
        router.push(`/signals/${id}`);
        break;
      case "source":
        router.push(`/signals/${id}`);
        break;
      case "calendar":
        router.push(`/calendar?signal=${encodeURIComponent(id)}`);
        break;
      case "runner": {
        const signal = payload.signals.find((s) => s.id === id);
        const params = new URLSearchParams();
        if (signal) {
          if (signal.brand && signal.brand !== "—") params.set("brand", signal.brand);
          if (signal.model && signal.model !== "—") params.set("model", signal.model);
          const sku = signal.sku && signal.sku !== "—" ? signal.sku : signal.reference && signal.reference !== "—" ? signal.reference : "";
          if (sku) params.set("sku", sku);
          if (signal.retail != null) params.set("price", String(signal.retail));
          if (signal.primaryUrl) params.set("url", signal.primaryUrl);
        }
        router.push(`/requests/new?${params.toString()}`);
        break;
      }
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
