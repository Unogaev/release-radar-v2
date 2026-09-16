// packages/domain/scoring/score.ts
//
// Spec §12: "Scoring ранжирует очередь, но не отменяет hard gates."
// This is enforced structurally: score.ts has no knowledge of DecisionStatus
// and cannot produce one — the decision engine consults gates FIRST, score
// SECOND, and only for ranking/tie-breaking within an already-gated status.

export interface ScoreComponents {
  demand: number; // 0-100
  scarcity: number; // 0-100
  margin: number; // 0-100
  access: number; // 0-100
  logistics: number; // 0-100
  userFit: number; // 0-100
}

export const SCORE_WEIGHTS = {
  demand: 0.25,
  scarcity: 0.2,
  margin: 0.2,
  access: 0.15,
  logistics: 0.1,
  userFit: 0.1,
} as const;

const WEIGHT_SUM = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(WEIGHT_SUM - 1) > 1e-9) {
  throw new Error(`SCORE_WEIGHTS must sum to 1.0, got ${WEIGHT_SUM}.`);
}

export type ScoreBand = "urgent" | "watch_verify" | "skip";

export interface ScoreResult {
  components: ScoreComponents;
  weightedScore: number; // 0-100
  band: ScoreBand;
}

function assertComponentRange(name: string, value: number) {
  if (value < 0 || value > 100) {
    throw new Error(`Score component "${name}" must be 0-100, got ${value}.`);
  }
}

export function calculateScore(components: ScoreComponents): ScoreResult {
  (Object.keys(components) as (keyof ScoreComponents)[]).forEach((k) =>
    assertComponentRange(k, components[k])
  );

  const weightedScore =
    components.demand * SCORE_WEIGHTS.demand +
    components.scarcity * SCORE_WEIGHTS.scarcity +
    components.margin * SCORE_WEIGHTS.margin +
    components.access * SCORE_WEIGHTS.access +
    components.logistics * SCORE_WEIGHTS.logistics +
    components.userFit * SCORE_WEIGHTS.userFit;

  let band: ScoreBand;
  if (weightedScore >= 80) band = "urgent";
  else if (weightedScore >= 65) band = "watch_verify";
  else band = "skip";

  return { components, weightedScore, band };
}

/**
 * evidence_confidence (spec §12): a SEPARATE number from the hype/demand
 * score. "Нельзя компенсировать высоким hype score" — the decision engine
 * must surface this independently, never blend it into weightedScore.
 */
export function calculateEvidenceConfidence(input: {
  evidenceLevelRank: number; // 0-5, from EVIDENCE_LEVEL_RANK
  sourceCount: number; // independent corroborating sources
  hasConflictingEvidence: boolean;
}): number {
  let confidence = (input.evidenceLevelRank / 5) * 70; // evidence level dominates
  confidence += Math.min(input.sourceCount, 3) * 10; // up to +30 for corroboration
  if (input.hasConflictingEvidence) confidence -= 25;
  return Math.max(0, Math.min(100, Math.round(confidence)));
}
