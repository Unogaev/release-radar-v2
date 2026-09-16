// packages/classification/SignalClassifier.ts
//
// Spec §16 draws an explicit two-tier line: "локальная/дешёвая модель или
// Ollama для массового triage; Claude только для top-ranked неоднозначных
// сигналов." Two classifiers, one interface — the pipeline (spec §16
// "Sources → adapters → ... → evidence classification → ...") calls this
// abstraction and never hardcodes which tier is in use. Critically: per
// spec §16 last line, "AI не определяет live inventory без инструментального
// evidence" — this classifier NEVER outputs an EvidenceLevel or
// AvailabilityEvidence directly; it only triages/ranks raw signals for
// human or rule-engine attention.

export interface ClassificationResult {
  isLikelyRelevant: boolean;
  suggestedCategory: string | null;
  confidence: number; // 0-100 — advisory only, never a gate input
}

export interface SignalClassifier {
  readonly tier: "bulk_triage" | "deep_analysis";
  classify(rawSignalText: string): Promise<ClassificationResult>;
}

// Phase 2 implements:
//   BulkTriageClassifier (Ollama or similarly cheap local model)
//   DeepAnalysisClassifier (Claude API, called only for top-ranked/ambiguous
//   signals that already passed bulk triage — never for availability facts)
