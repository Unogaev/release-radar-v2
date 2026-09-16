// packages/domain/reminders/idempotency.ts
//
// Spec §13 EXACTLY:
//   idempotency key = user_id:event_id:stage:event_start_version
//   "Если время изменилось, увеличить event_start_version, отменить будущие
//    старые reminders и отправить TIME_CHANGED. Если продажа открылась
//    раньше — OPENED_EARLY независимо от предыдущих этапов."
//
// AT-11 (changed release time) and AT-12 (duplicate alert) are proven by
// this module's functions directly.

export type ReminderStage =
  | "first_discovery"
  | "t_minus_72h"
  | "t_minus_24h"
  | "t_minus_3h"
  | "t_minus_1h"
  | "opening_hour";

export interface ReminderKeyInput {
  userId: string;
  eventId: string;
  stage: ReminderStage;
  eventStartVersion: number;
}

export function buildIdempotencyKey(input: ReminderKeyInput): string {
  return `${input.userId}:${input.eventId}:${input.stage}:${input.eventStartVersion}`;
}

export interface ReminderRecord {
  key: string;
  stage: ReminderStage;
  eventStartVersion: number;
  sentAt: string | null; // null = scheduled, not yet sent
}

/**
 * AT-12: one alert per stage. A stage is only sent if no ReminderRecord with
 * the same idempotency key has already been sent.
 */
export function shouldSendReminder(
  existing: ReminderRecord[],
  candidate: ReminderKeyInput
): boolean {
  const key = buildIdempotencyKey(candidate);
  return !existing.some((r) => r.key === key && r.sentAt !== null);
}

export interface TimeChangeResult {
  newEventStartVersion: number;
  cancelledStages: ReminderStage[]; // future old-version reminders to cancel
  sendTimeChangedNotice: boolean;
}

/**
 * AT-11: when the official start time changes, bump event_start_version,
 * cancel any FUTURE (not-yet-sent) reminders tied to the old version, and
 * flag that a TIME_CHANGED notice must go out. Already-sent reminders are
 * left alone — they are historical record, not retracted.
 */
export function handleTimeChange(
  previousVersion: number,
  existing: ReminderRecord[]
): TimeChangeResult {
  const newVersion = previousVersion + 1;
  const cancelledStages = existing
    .filter((r) => r.eventStartVersion === previousVersion && r.sentAt === null)
    .map((r) => r.stage);

  return {
    newEventStartVersion: newVersion,
    cancelledStages,
    sendTimeChangedNotice: true,
  };
}

/**
 * "Если продажа открылась раньше — OPENED_EARLY независимо от предыдущих
 * этапов." This is a one-shot notice independent of the staged schedule.
 */
export function shouldSendOpenedEarly(actualOpenTime: string, scheduledOpenTime: string): boolean {
  return new Date(actualOpenTime).getTime() < new Date(scheduledOpenTime).getTime();
}
