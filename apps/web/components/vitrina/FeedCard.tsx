"use client";

import { Badge } from "./Badge";
import { Card } from "./Card";
import { Countdown } from "./Countdown";
import { CTAButton } from "./CTAButton";
import { ImageWithFallback } from "./ImageWithFallback";
import { PriceBlock, type Completeness } from "./PriceBlock";
import { buildCardViewModel, type CardKind } from "@/lib/radar/cardViewModel";

export interface FeedCardData {
  id: string;
  detailId?: string | null;
  kind: CardKind;
  status?: string | null;
  brand?: string | null;
  name: string;
  sku?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  retailUsd?: number | null;
  completedSalesCount?: number | null;
  expectedResaleUsd?: number | null;
  askFromUsd?: number | null;
  launchAt?: string | null;
  store?: string | null;
  region?: string | null;
  isMarketStory?: boolean;
  checkedAt?: string | null;
  purchaseUrl?: string | null;
  sourceUrl?: string | null;
  profitUsd?: number | null;
  marginPct?: number | null;
}

function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function FeedCard({ data, onAction }: { data: FeedCardData; onAction?: (id: string, cta: string) => void }) {
  const vm = buildCardViewModel({
    kind: data.kind,
    status: data.status,
    retailUsd: data.retailUsd,
    completedSalesCount: data.completedSalesCount,
    expectedResaleUsd: data.expectedResaleUsd,
    askFromUsd: data.askFromUsd,
    purchaseUrl: data.purchaseUrl,
    sourceUrl: data.sourceUrl,
  });

  const statusKey = (data.status === "buy" ? "buy"
    : data.status === "apply" ? "apply"
    : data.status === "prepare" ? "prepare"
    : data.status === "client" ? "client"
    : data.kind === "RELEASE" ? "release"
    : data.kind === "NEWS" ? "news"
    : "watch") as "buy" | "apply" | "prepare" | "client" | "watch" | "release" | "news";

  const checked = timeAgo(data.checkedAt);

  return (
    <Card>
      <div className="relative">
        <ImageWithFallback src={data.imageUrl} alt={data.imageAlt ?? data.name} className="aspect-[4/5] w-full" />
        <div className="absolute left-3 top-3">
          <Badge status={statusKey} />
        </div>
        {data.launchAt && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 backdrop-blur">
            <Countdown targetAt={data.launchAt} />
          </div>
        )}
      </div>
      <div className="p-4">
        {data.brand && (
          <div className="text-[12px] text-[#6b7280]">{data.brand}</div>
        )}
        <h3 className="mt-1 line-clamp-2 text-[16px] font-semibold leading-snug text-[#1a1a1a]">
          {data.name}
        </h3>
        {data.sku && (
          <div className="mt-1 text-[12px] tabular-nums text-[#9ca3af]">{data.sku}</div>
        )}
        <div className="mt-3">
          <PriceBlock
            level={vm.completeness}
            retail={data.retailUsd}
            profit={data.profitUsd}
            marginPct={data.marginPct}
            askFrom={data.askFromUsd}
          />
        </div>
        {(data.store || data.region || checked) && (
          <div className="mt-3 flex flex-wrap gap-x-2 text-[12px] text-[#6b7280]">
            {data.store && <span>{data.store}</span>}
            {data.store && data.region && <span>·</span>}
            {data.region && <span>{data.region}</span>}
            {checked && <span>· checked {checked}</span>}
          </div>
        )}
        <div className="mt-4">
          <CTAButton
            href={
              vm.cta === "buy" || vm.cta === "read"
                ? (data.purchaseUrl ?? data.sourceUrl ?? undefined)
                : vm.cta === "client"
                  ? (() => {
                      const p = new URLSearchParams();
                      if (data.brand) p.set("brand", data.brand);
                      p.set("model", data.name);
                      if (data.sku) p.set("sku", data.sku);
                      if (data.retailUsd != null) p.set("price", String(data.retailUsd));
                      const u = data.purchaseUrl ?? data.sourceUrl;
                      if (u) p.set("url", u);
                      return `/requests/new?${p.toString()}`;
                    })()
                  : vm.cta === "remind"
                    ? "/calendar"
                    : `/signals/${data.detailId ?? data.id}`
            }
          >
            {vm.ctaLabel}
          </CTAButton>
        </div>
      </div>
    </Card>
  );
}
