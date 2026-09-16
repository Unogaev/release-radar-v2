// packages/notifications/channels/telegram/TelegramChannel.ts
import { NotificationChannel, NotificationSendResult } from "../../NotificationChannel";

export class TelegramChannel implements NotificationChannel {
  readonly id = "telegram" as const;

  constructor(
    private readonly botToken: string,
    private readonly chatIdByUser: (userId: string) => Promise<string | null>
  ) {}

  async send(userId: string, payload: string): Promise<NotificationSendResult> {
    const chatId = await this.chatIdByUser(userId);
    if (!chatId) {
      return { success: false, error: "No Telegram chat_id linked for this user." };
    }
    if (!this.botToken) {
      return { success: false, error: "TELEGRAM_BOT_TOKEN not configured." };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: payload, disable_web_page_preview: true }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { success: false, error: `Telegram API ${res.status}: ${body}` };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Network error." };
    }
  }
}
