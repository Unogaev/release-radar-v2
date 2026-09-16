// packages/domain/decision/hardGates.ts
//
// Implements spec §7 EXACTLY. Each gate function returns every unmet
// condition, not just the first — the decision engine needs the full list
// for the alert's "Риск" line and for VERIFY's explanation.
//
// Critical invariant tested by AT-09: gates are NEVER satisfied by score
// alone. A $50,000 watch with no client fails the BUY_NOW gate even at a
// perfect score.

import { AvailabilityEvidence, EvidenceLevel, evidenceAtLeast } from "../evidence/types";
import { findBuyNowBlockReasons } from "../evidence/ladder";

export interface GateCheckResult {
  passed: boolean;
  failedReasons: string[];
}

function fail(reasons: string[]): GateCheckResult {
  return { passed: false, failedReasons: reasons };
}
function pass(): GateCheckResult {
  return { passed: true, failedReasons: [] };
}

// ---------- BUY_NOW (spec §7, all 7 conditions mandatory) ----------

export interface BuyNowGateInput {
  productIdentified: boolean; // (1) exact product + variant identification
  sellerOfRecord: string | null;
  allowedSellers: string[]; // (2) allowed seller-of-record list
  evidenceLevel: EvidenceLevel; // (3) E3, or E4 required for "problematic retailers"
  isProblematicRetailer: boolean; // e.g. Best Buy / PlayStation Direct — needs E4
  availability: AvailabilityEvidence;
  checkoutPriceKnown: boolean; // (4)
  fullCostKnown: boolean; // (4)
  maxBuyPriceSet: boolean; // (5)
  quantityLimitSet: boolean; // (5)
  isResaleScenario: boolean;
  hasCompletedSalesOrConfirmedClient: boolean; // (6)
  projectedEconomicsPasses: boolean; // (6)
  hasBlockingLegalOrLogisticsRisk: boolean; // (7)
}

export function checkBuyNowGate(input: BuyNowGateInput): GateCheckResult {
  const reasons: string[] = [];

  if (!input.productIdentified) reasons.push("Продукт/вариант не идентифицирован точно.");

  const requiredLevel = input.isProblematicRetailer
    ? EvidenceLevel.E4_CART_VERIFIED
    : EvidenceLevel.E3_ACTIONABLE;
  if (!evidenceAtLeast(input.evidenceLevel, requiredLevel)) {
    reasons.push(
      `Evidence level ${input.evidenceLevel} ниже требуемого ${requiredLevel}${
        input.isProblematicRetailer ? " (проблемный retailer требует E4)" : ""
      }.`
    );
  }

  // The full evidence-ladder prohibition list from spec §6 also applies.
  reasons.push(
    ...findBuyNowBlockReasons(input.availability, input.allowedSellers).map((r) => r.message)
  );

  if (!input.checkoutPriceKnown || !input.fullCostKnown) {
    reasons.push("Checkout price или полная стоимость неизвестны.");
  }
  if (!input.maxBuyPriceSet || !input.quantityLimitSet) {
    reasons.push("Max buy price или quantity limit не заданы.");
  }

  if (input.isResaleScenario) {
    if (!input.hasCompletedSalesOrConfirmedClient) {
      reasons.push("Для перепродажи нет completed sales или подтверждённого клиента.");
    }
    if (!input.projectedEconomicsPasses) {
      reasons.push("Projected economics не проходит порог.");
    }
  }

  if (input.hasBlockingLegalOrLogisticsRisk) {
    reasons.push("Есть блокирующий legal/logistics risk.");
  }

  return reasons.length === 0 ? pass() : fail(reasons);
}

// ---------- APPLY_NOW (spec §7) ----------

export interface ApplyNowGateInput {
  applicationOrRaffleOpen: boolean;
  closingTimeKnown: boolean;
  rulesKnown: boolean;
  autoChargeDisclosed: boolean; // AT-06
  eligibilityKnown: boolean;
  userUnderstandsWinOutcome: boolean;
}

export function checkApplyNowGate(input: ApplyNowGateInput): GateCheckResult {
  const reasons: string[] = [];
  if (!input.applicationOrRaffleOpen) reasons.push("Application/raffle/waitlist не открыт.");
  if (!input.closingTimeKnown) reasons.push("Closing time неизвестно.");
  if (!input.rulesKnown) reasons.push("Правила заявки неизвестны.");
  if (!input.autoChargeDisclosed) reasons.push("Auto-charge условия не раскрыты пользователю.");
  if (!input.eligibilityKnown) reasons.push("Eligibility неизвестна.");
  if (!input.userUnderstandsWinOutcome) reasons.push("Не объяснено, что произойдёт при выигрыше.");
  return reasons.length === 0 ? pass() : fail(reasons);
}

// ---------- PREPARE (spec §7) ----------

export interface PrepareGateInput {
  confirmedBySourceE2: boolean;
  dateAndTimeOfficial: boolean;
  timePrecision: "exact" | "date_only" | "tba";
  isFirstGenerationTechAnnouncement: boolean; // exception allowed without alarm
  launchUrlKnown: boolean;
  preparationActionsFormed: boolean;
}

export function checkPrepareGate(input: PrepareGateInput): GateCheckResult {
  const reasons: string[] = [];
  if (!input.confirmedBySourceE2) reasons.push("Событие не подтверждено источником E2.");

  // AT-05: TBA time can only ever produce WATCH, except the first-gen tech
  // announcement carve-out (early PREPARE without an alarm/reminder).
  if (input.timePrecision === "tba" && !input.isFirstGenerationTechAnnouncement) {
    reasons.push("Время TBA — допустим только WATCH, пока время не подтверждено.");
  }
  if (input.timePrecision !== "tba" && !input.dateAndTimeOfficial) {
    reasons.push("Дата/время не официальны.");
  }
  if (!input.launchUrlKnown) reasons.push("URL/механизм запуска неизвестен.");
  if (!input.preparationActionsFormed) reasons.push("Подготовительные действия не сформированы.");
  return reasons.length === 0 ? pass() : fail(reasons);
}

// ---------- CLIENT_FIRST / SOURCE_NOW (spec §7) ----------

export interface ClientFirstGateInput {
  hasBuyerRequest: boolean;
  priceTooHighForInventoryRisk: boolean; // e.g. watches >$10,000 without proven scarcity
  variantDetailsSaved: boolean; // size/color/configuration
  deadlineSaved: boolean;
  customerCeilingSaved: boolean;
  sourceCostBelowMaxSourcePrice: boolean | null; // null = not yet computed
}

export function checkClientFirstGate(input: ClientFirstGateInput): GateCheckResult {
  const reasons: string[] = [];
  if (!input.hasBuyerRequest && !input.priceTooHighForInventoryRisk) {
    reasons.push("Нет ни buyer request, ни неприемлемого инвентарного риска по цене.");
  }
  if (!input.variantDetailsSaved) reasons.push("Размер/цвет/конфигурация не сохранены.");
  if (!input.deadlineSaved) reasons.push("Deadline не сохранён.");
  if (!input.customerCeilingSaved) reasons.push("Customer ceiling не сохранён.");
  if (input.sourceCostBelowMaxSourcePrice === false) {
    reasons.push("Source cost выше вычисленного max_source_price.");
  }
  return reasons.length === 0 ? pass() : fail(reasons);
}

/**
 * Expensive-item override (spec §3.6, AT-09): watches >$10,000, cars,
 * expensive tech without proven scarcity, complex cross-border deals — the
 * DEFAULT status is CLIENT_FIRST/APPLY_NOW/CONTACT_DEALER, never BUY_NOW,
 * regardless of how strong the evidence otherwise is. This is checked
 * BEFORE the BUY_NOW gate is even attempted by the decision engine.
 */
export function requiresClientFirstOverride(input: {
  priceUsd: number;
  category: "watch" | "automotive" | "expensive_tech" | "other";
  provenScarcity: boolean;
  crossBorderComplexity: boolean;
}): boolean {
  if (input.category === "watch" && input.priceUsd > 10_000) return true;
  if (input.category === "automotive") return true;
  if (input.category === "expensive_tech" && !input.provenScarcity) return true;
  if (input.crossBorderComplexity) return true;
  return false;
}
