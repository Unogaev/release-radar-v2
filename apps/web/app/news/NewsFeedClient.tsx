"use client";

import Link from "next/link";
import type { NewsItem } from "@/lib/radar/types";

const TAG_STYLE: Record<NewsItem["kind"], { label: string; className: string }> = {
  NEWS: { label: "NEWS", className: "bg-rr-hair text-rr-muted" },
  MARKET: { label: "MARKET", className: "bg-rr-apply-bg text-rr-apply" },
  RELEASE: { label: "RELEASE", className: "bg-rr-client-bg text-rr-client" },
  SIGNAL: { label: "SIGNAL", className: "bg-rr-buy-bg text-rr-buy" },
  ALERT: { label: "ALERT", className: "bg-rr-risk-bg text-rr-risk" },
};

function hueFor(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function brandCover(label: string): string {
  const h = hueFor(label);
  const initials = label
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${h},34%,88%)"/>
        <stop offset="1" stop-color="hsl(${(h + 40) % 360},40%,80%)"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="16" fill="url(#g)"/>
    <circle cx="60" cy="46" r="26" fill="rgba(22,21,20,0.08)"/>
    <text x="60" y="56" font-family="sans-serif" font-size="26" font-weight="700" fill="rgba(22,21,20,0.72)" text-anchor="middle">${initials}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "только что";
  if (min < 60) return min + " мин назад";
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return hrs + " ч назад";
  const days = Math.floor(hrs / 24);
  return days + " дн " + (days === 1 ? "назад" : "назад");
}

export function NewsFeedClient({ items }: { items: NewsItem[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/now" className="mb-4 inline-flex text-xs font-semibold text-rr-accent">← Вернуться в центр действий</Link>
        <h1 className="font-rr-display text-[22px] tracking-[-0.01em]">Новости и релизы</h1>
        <p className="mt-1 text-[13px] text-rr-text-dim">
          NEWS / RELEASE / SIGNAL / ALERT — хронологическая лента, не смешивается с подтверждёнными сигналами покупки.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-rr-hair bg-rr-surface px-6 py-10 text-center">
          <div className="font-rr-display text-[15px]">Пока ничего нет</div>
          <div className="mt-1 text-[12.5px] text-rr-text-dim">
            Новости, релизы и алерты появятся здесь, как только будут собраны пайплайном.
          </div>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-rr-hair rounded-2xl border border-rr-hair bg-rr-surface">
          {items.map((item) => {
            const tag = TAG_STYLE[item.kind];
            const cover = item.imageUrl ?? brandCover(item.brand ?? item.source);
            const body = (
              <div className="flex items-center gap-3 px-4 py-3">
                <img src={cover} alt="" className="h-12 w-12 flex-none rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <span className={`inline-block rounded px-1.5 py-0.5 font-rr-mono text-[8.5px] font-bold uppercase tracking-[0.06em] ${tag.className}`}>
                    {tag.label}
                  </span>
                  <div className="mt-1 truncate text-[13px] font-medium leading-snug">{item.headline}</div>
                  <div className="mt-0.5 font-rr-mono text-[10px] text-rr-faint">
                    {item.source} · {timeAgo(item.observedAt)}
                  </div>
                </div>
              </div>
            );
            return item.sourceUrl ? (
              <Link key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer" className="transition-colors hover:bg-rr-surface-hi">
                {body}
              </Link>
            ) : (
              <div key={item.id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
