// packages/testing/acceptance/AT-06.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { checkApplyNowGate } from "../../domain/decision/hardGates";

export const AT06: AcceptanceTest = {
  id: "AT-06",
  title: "Auto-charge raffle — must disclose auto-charge before APPLY_NOW is allowed",
  run: () => {
    const t = new TestContext();

    const withoutDisclosure = checkApplyNowGate({
      applicationOrRaffleOpen: true,
      closingTimeKnown: true,
      rulesKnown: true,
      autoChargeDisclosed: false,
      eligibilityKnown: true,
      userUnderstandsWinOutcome: true,
    });
    t.assertFalse(withoutDisclosure.passed, "AT-06 gate must fail without auto-charge disclosure");
    t.assertIncludes(
      withoutDisclosure.failedReasons,
      "Auto-charge",
      "AT-06 failure reason mentions auto-charge"
    );

    const withDisclosure = checkApplyNowGate({
      applicationOrRaffleOpen: true,
      closingTimeKnown: true,
      rulesKnown: true,
      autoChargeDisclosed: true,
      eligibilityKnown: true,
      userUnderstandsWinOutcome: true,
    });
    t.assertTrue(withDisclosure.passed, "AT-06 gate passes once auto-charge is disclosed");

    return t.failures;
  },
};
