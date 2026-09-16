// packages/testing/acceptance/AT-11.ts
import { AcceptanceTest, TestContext } from "./testKit";
import { handleTimeChange, ReminderRecord } from "../../domain/reminders/idempotency";

export const AT11: AcceptanceTest = {
  id: "AT-11",
  title: "Changed release time — after a sent 24h reminder, official start time changes",
  run: () => {
    const t = new TestContext();

    const existing: ReminderRecord[] = [
      { key: "u1:ev1:t_minus_72h:1", stage: "t_minus_72h", eventStartVersion: 1, sentAt: "2026-09-01T00:00:00Z" },
      { key: "u1:ev1:t_minus_24h:1", stage: "t_minus_24h", eventStartVersion: 1, sentAt: "2026-09-03T00:00:00Z" },
      // Not yet sent — these are the ones that must be cancelled.
      { key: "u1:ev1:t_minus_3h:1", stage: "t_minus_3h", eventStartVersion: 1, sentAt: null },
      { key: "u1:ev1:t_minus_1h:1", stage: "t_minus_1h", eventStartVersion: 1, sentAt: null },
      { key: "u1:ev1:opening_hour:1", stage: "opening_hour", eventStartVersion: 1, sentAt: null },
    ];

    const result = handleTimeChange(1, existing);

    t.assertEqual(result.newEventStartVersion, 2, "AT-11 version bumped to 2");
    t.assertEqual(
      result.cancelledStages.sort(),
      ["opening_hour", "t_minus_1h", "t_minus_3h"].sort(),
      "AT-11 only future unsent stages are cancelled"
    );
    t.assertTrue(result.sendTimeChangedNotice, "AT-11 TIME_CHANGED notice must be sent");

    // Already-sent reminders (72h, 24h) are historical — never cancelled/retracted.
    t.assertFalse(
      result.cancelledStages.includes("t_minus_72h"),
      "AT-11 already-sent 72h reminder is not touched"
    );
    t.assertFalse(
      result.cancelledStages.includes("t_minus_24h"),
      "AT-11 already-sent 24h reminder is not touched"
    );

    return t.failures;
  },
};
