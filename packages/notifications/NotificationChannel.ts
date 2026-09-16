// packages/notifications/NotificationChannel.ts
//
// Spec §16: "Notifications: Telegram первым, затем Web Push/email."
// The reminder scheduler (Phase 1) depends on THIS interface, never on a
// concrete channel — so adding Web Push/email in Phase 2 is a new file in
// channels/, not a rewrite of the scheduler or the domain reminder logic.

export interface NotificationSendResult {
  success: boolean;
  error?: string;
}

export interface NotificationChannel {
  readonly id: "telegram" | "webpush" | "email";
  send(userId: string, payload: string): Promise<NotificationSendResult>;
}

// Phase 1 implements: packages/notifications/channels/telegram/TelegramChannel.ts
// Phase 2 implements: channels/webpush/, channels/email/
