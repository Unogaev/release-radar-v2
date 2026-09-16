// packages/domain/decision/types.ts
//
// The 13 internal decision statuses from spec §5, plus the 5-label Simple UI
// mapping. Internal statuses are never invented or abbreviated — the Simple
// UI mapping is presentation-only and lives in a separate function so the
// domain layer's own logic always works with the full 13.

export enum DecisionStatus {
  BUY_NOW = "BUY_NOW",
  APPLY_NOW = "APPLY_NOW",
  PREPARE = "PREPARE",
  CLIENT_FIRST = "CLIENT_FIRST",
  SOURCE_NOW = "SOURCE_NOW",
  CONTACT_DEALER = "CONTACT_DEALER",
  APPLY_RESERVE = "APPLY_RESERVE",
  RESERVE_PICKUP = "RESERVE_PICKUP",
  VERIFY_IN_STORE = "VERIFY_IN_STORE",
  WATCH_RESTOCK = "WATCH_RESTOCK",
  WATCH = "WATCH",
  VERIFY = "VERIFY",
  SKIP = "SKIP",
}

/** Simple UI collapses the 13 statuses to 5 labels, spec §5 last line. */
export type SimpleLabel = "КУПИТЬ" | "ПОДАТЬ ЗАЯВКУ" | "ГОТОВИТЬСЯ" | "СЛЕДИТЬ" | "ПРОПУСТИТЬ";

export const SIMPLE_LABEL_MAP: Record<DecisionStatus, SimpleLabel> = {
  [DecisionStatus.BUY_NOW]: "КУПИТЬ",
  [DecisionStatus.APPLY_NOW]: "ПОДАТЬ ЗАЯВКУ",
  [DecisionStatus.APPLY_RESERVE]: "ПОДАТЬ ЗАЯВКУ",
  [DecisionStatus.RESERVE_PICKUP]: "ПОДАТЬ ЗАЯВКУ",
  [DecisionStatus.PREPARE]: "ГОТОВИТЬСЯ",
  [DecisionStatus.CLIENT_FIRST]: "СЛЕДИТЬ",
  [DecisionStatus.SOURCE_NOW]: "СЛЕДИТЬ",
  [DecisionStatus.CONTACT_DEALER]: "СЛЕДИТЬ",
  [DecisionStatus.VERIFY_IN_STORE]: "СЛЕДИТЬ",
  [DecisionStatus.WATCH_RESTOCK]: "СЛЕДИТЬ",
  [DecisionStatus.WATCH]: "СЛЕДИТЬ",
  [DecisionStatus.VERIFY]: "СЛЕДИТЬ",
  [DecisionStatus.SKIP]: "ПРОПУСТИТЬ",
};

export interface DecisionResult {
  status: DecisionStatus;
  ruleVersion: string;
  rationale: string;
  blockedReasons: string[]; // why a stronger status (e.g. BUY_NOW) was NOT chosen
  evidenceConfidence: number; // 0-100, cannot be compensated by hype score (spec §12)
}
