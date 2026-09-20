// apps/web/lib/data.ts
import { prisma } from "./prisma";
import { DecisionStatus } from "@domain/decision/types";

// СЕЙЧАС — only decisions that are actionable right now (spec §4.1).
const NOW_STATUSES: string[] = [
  DecisionStatus.BUY_NOW,
  DecisionStatus.APPLY_NOW,
  DecisionStatus.APPLY_RESERVE,
  DecisionStatus.RESERVE_PICKUP,
  DecisionStatus.CONTACT_DEALER,
  DecisionStatus.SOURCE_NOW,
];

export async function getNowFeed(userId: string) {
  return prisma.decision.findMany({
    where: { status: { in: NOW_STATUSES } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      productVariant: { include: { product: true, identifiers: true } },
      alerts: { where: { userId }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getSoonEvents(userId: string) {
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return prisma.releaseEvent.findMany({
    where: {
      startAtUtc: { gte: new Date(), lte: in7Days },
    },
    orderBy: { startAtUtc: "asc" },
    include: {
      productVariant: {
        include: {
          product: true,
          decisions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
}

export async function getCalendarEvents(userId: string) {
  const rangeStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const rangeEnd = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  return prisma.releaseEvent.findMany({
    where: {
      startAtUtc: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: { startAtUtc: "asc" },
    include: {
      productVariant: {
        include: {
          product: true,
          decisions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
}

export async function getRadarSignals() {
  // НА РАДАРЕ: official announcements without open sales, first-generation
  // categories, athlete/celebrity debuts, potential post-release deficit —
  // modeled here as decisions sitting in the informational/watch band.
  const RADAR_STATUSES: string[] = [
    DecisionStatus.WATCH,
    DecisionStatus.WATCH_RESTOCK,
    DecisionStatus.VERIFY,
    DecisionStatus.VERIFY_IN_STORE,
    DecisionStatus.PREPARE,
    DecisionStatus.CLIENT_FIRST,
  ];
  return prisma.decision.findMany({
    where: { status: { in: RADAR_STATUSES } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      productVariant: { include: { product: true } },
    },
  });
}

export async function getMyPurchases(userId: string) {
  return prisma.purchase.findMany({
    where: { userId },
    orderBy: { confirmedAt: "desc" },
    include: {
      productVariant: { include: { product: true } },
    },
  });
}

export async function getDecisionDetail(decisionId: string) {
  return prisma.decision.findUnique({
    where: { id: decisionId },
    include: {
      productVariant: {
        include: {
          product: true,
          identifiers: true,
          evidence: { orderBy: { observedAt: "desc" }, include: { source: true } },
          availabilityChecks: { orderBy: { checkedAt: "desc" }, take: 5 },
          marketSales: { orderBy: { observedAt: "desc" }, take: 10 },
          marketAsks: { orderBy: { observedAt: "desc" }, take: 10 },
          releaseEvents: { orderBy: { startAtUtc: "desc" }, take: 1 },
        },
      },
    },
  });
}
