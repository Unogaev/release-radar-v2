// packages/domain/decision/decisionEngine.ts
//
// Ties together evidence, hard gates (hardGates.ts) and scoring (score.ts)
// into one DecisionResult. Structural invariant: gates are tried in strict
// priority order and score NEVER promotes a status past a failed gate — it
// only picks among already-gate-passed candidates and, when no gate passes,
// selects among the "soft" fallback statuses (WATCH_RESTOCK / VERIFY_IN_STORE
// / WATCH / VERIFY / SKIP), which are informational, not actionable-money
// statuses, so score is safe to use there.

import { EvidenceLevel } from "../evidence/types";
import {
  ApplyNowGateInput,
  BuyNowGateInput,
  ClientFirstGateInput,
  PrepareGateInput,
  checkApplyNowGate,
  checkBuyNowGate,
  checkClientFirstGate,
  checkPrepareGate,
  requiresClientFirstOverride,
} from "./hardGates";
import { calculateEvidenceConfidence, calculateScore, ScoreComponents } from "../scoring/score";
import { DecisionResult, DecisionStatus } from "./types";

export const RULE_VERSION = "2.0.0"; // matches spec version 2.0 Final

/**
 * Fallback hint: which "soft" non-actionable status applies when no hard
 * gate passes. This is set by the caller (adapter/category logic), not
 * inferred here — Phase 0 keeps that categorization out of the core engine
 * since it's genuinely category-specific (retailer parsers, clearance
 * confirmation flows) and belongs to Phase 2 adapters.
 */
export type FallbackHint =
  | "restock_candidate" // product was actionable, now isn't -> WATCH_RESTOCK
  | "local_clearance_unconfirmed" // single-store viral report, no verified checkout -> VERIFY_IN_STORE
  | "insufficient_evidence" // seller not allowed / conflicting evidence -> VERIFY
  | "low_interest"; // nothing wrong, just not worth an action -> WATCH or SKIP

export interface DecisionContext {
  expensiveItemOverride: {
    applies: boolean; // result of requiresClientFirstOverride()
  };
  buyNow: BuyNowGateInput;
  applyNow: ApplyNowGateInput | null;
  prepare: PrepareGateInput | null;
  clientFirst: ClientFirstGateInput | null;
  fallbackHint: FallbackHint;
  score: ScoreComponents;
  evidenceLevel: EvidenceLevel;
  sourceCount: number;
  hasConflictingEvidence: boolean;
}

export function decide(ctx: DecisionContext): DecisionResult {
  const evidenceConfidence = calculateEvidenceConfidence({
    evidenceLevelRank: evidenceLevelRankOf(ctx.evidenceLevel),
    sourceCount: ctx.sourceCount,
    hasConflictingEvidence: ctx.hasConflictingEvidence,
  });

  const blockedReasons: string[] = [];

  // Expensive-item override (spec §3.6 / AT-09) short-circuits BUY_NOW
  // entirely, before the gate is even attempted.
  if (!ctx.expensiveItemOverride.applies) {
    const buyNowResult = checkBuyNowGate(ctx.buyNow);
    if (buyNowResult.passed) {
      return {
        status: DecisionStatus.BUY_NOW,
        ruleVersion: RULE_VERSION,
        rationale: "Все hard gates BUY_NOW пройдены.",
        blockedReasons: [],
        evidenceConfidence,
      };
    }
    blockedReasons.push(...buyNowResult.failedReasons.map((r) => `[BUY_NOW] ${r}`));
  } else {
    blockedReasons.push(
      "[BUY_NOW] Дорогая позиция без подтверждённого дефицита/клиента — override на CLIENT_FIRST/APPLY_NOW/CONTACT_DEALER (spec §3.6)."
    );
  }

  if (ctx.applyNow) {
    const applyNowResult = checkApplyNowGate(ctx.applyNow);
    if (applyNowResult.passed) {
      return {
        status: DecisionStatus.APPLY_NOW,
        ruleVersion: RULE_VERSION,
        rationale: "Application/raffle открыт, все условия раскрыты пользователю.",
        blockedReasons,
        evidenceConfidence,
      };
    }
    blockedReasons.push(...applyNowResult.failedReasons.map((r) => `[APPLY_NOW] ${r}`));
  }

  if (ctx.prepare) {
    const prepareResult = checkPrepareGate(ctx.prepare);
    if (prepareResult.passed) {
      return {
        status: DecisionStatus.PREPARE,
        ruleVersion: RULE_VERSION,
        rationale: "Событие подтверждено официально, время известно.",
        blockedReasons,
        evidenceConfidence,
      };
    }
    blockedReasons.push(...prepareResult.failedReasons.map((r) => `[PREPARE] ${r}`));
  }

  if (ctx.clientFirst) {
    const clientFirstResult = checkClientFirstGate(ctx.clientFirst);
    if (clientFirstResult.passed) {
      const status = ctx.expensiveItemOverride.applies
        ? DecisionStatus.CLIENT_FIRST
        : DecisionStatus.SOURCE_NOW;
      return {
        status,
        ruleVersion: RULE_VERSION,
        rationale: "Buyer request или инвентарный риск подтверждён, параметры сохранены.",
        blockedReasons,
        evidenceConfidence,
      };
    }
    blockedReasons.push(...clientFirstResult.failedReasons.map((r) => `[CLIENT_FIRST] ${r}`));
  }

  // No hard-gated status passed — fall back to a soft, non-actionable-money
  // status. Score is used here only to distinguish WATCH from SKIP; it
  // NEVER promotes to an actionable status (structural guarantee: none of
  // the branches above read `ctx.score`).
  const scoreResult = calculateScore(ctx.score);

  switch (ctx.fallbackHint) {
    case "restock_candidate":
      return {
        status: DecisionStatus.WATCH_RESTOCK,
        ruleVersion: RULE_VERSION,
        rationale: "Товар был actionable, сейчас недоступен — ждём restock.",
        blockedReasons,
        evidenceConfidence,
      };
    case "local_clearance_unconfirmed":
      return {
        status: DecisionStatus.VERIFY_IN_STORE,
        ruleVersion: RULE_VERSION,
        rationale: "Единичный отчёт без подтверждённого store-level checkout.",
        blockedReasons,
        evidenceConfidence,
      };
    case "insufficient_evidence":
      return {
        status: DecisionStatus.VERIFY,
        ruleVersion: RULE_VERSION,
        rationale: "Недостаточно доказательств продавца, цены, подлинности или наличия.",
        blockedReasons,
        evidenceConfidence,
      };
    case "low_interest":
      return {
        status: scoreResult.band === "skip" ? DecisionStatus.SKIP : DecisionStatus.WATCH,
        ruleVersion: RULE_VERSION,
        rationale:
          scoreResult.band === "skip"
            ? `Score ${scoreResult.weightedScore.toFixed(1)} ниже порога, buyer request отсутствует.`
            : "Интересно, но действие ещё не подтверждено.",
        blockedReasons,
        evidenceConfidence,
      };
  }
}

function evidenceLevelRankOf(level: EvidenceLevel): number {
  const order = [
    EvidenceLevel.E0_RUMOR,
    EvidenceLevel.E1_SIGNAL,
    EvidenceLevel.E2_OFFICIAL,
    EvidenceLevel.E3_ACTIONABLE,
    EvidenceLevel.E4_CART_VERIFIED,
    EvidenceLevel.E5_USER_CONFIRMED,
  ];
  return order.indexOf(level);
}

export { requiresClientFirstOverride };
