// packages/testing/acceptance/AT-12.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { buildIdempotencyKey, ReminderRecord, shouldSendReminder } from "../../domain/reminders/idempotency";

export const AT12: AcceptanceTest = {
  id: "AT-12",
  title: "Duplicate alert — one adapter returns the same event multiple times",
  run: () => {
    const t = new TestContext();

    const candidate = {
      userId: "u1",
      eventId: "ev1",
      stage: "t_minus_24h" as const,
      eventStartVersion: 1,
    };

    // First time the adapter reports this event/stage: no record exists yet.
    const firstCheck = shouldSendReminder([], candidate);
    t.assertTrue(firstCheck, "AT-12 first occurrence should be allowed to send");

    // Simulate the send being recorded.
    const afterFirstSend: ReminderRecord[] = [
      { key: buildIdempotencyKey(candidate), stage: candidate.stage, eventStartVersion: 1, sentAt: "2026-09-03T00:00:00Z" },
    ];

    // Adapter polls again and returns the SAME event — must not resend.
    const secondCheck = shouldSendReminder(afterFirstSend, candidate);
    t.assertFalse(secondCheck, "AT-12 duplicate occurrence must NOT trigger a second send");

    // Even a third, fourth poll of the same duplicate — still no resend.
    const thirdCheck = shouldSendReminder(afterFirstSend, candidate);
    t.assertFalse(thirdCheck, "AT-12 repeated duplicate polls still must not resend");

    // A DIFFERENT stage for the same event is a genuinely new alert — allowed.
    const differentStage = shouldSendReminder(afterFirstSend, { ...candidate, stage: "t_minus_3h" });
    t.assertTrue(differentStage, "AT-12 a different stage for the same event is a distinct alert");

    return t.failures;
  },
};
