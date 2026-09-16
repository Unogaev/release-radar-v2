// packages/jobs/JobScheduler.ts
//
// Spec §17 lists ~10 background jobs (priority inventory monitor, 72h event
// scan, reminder dispatcher, etc). Spec §16 suggests Redis+BullMQ, but that's
// a heavy dependency not needed for Phase 1's job volume. This interface lets
// Phase 1 run on Vercel Cron (cheap, zero extra infra) and Phase 2 swap in
// BullMQ once real source polling volume justifies it — the reminder
// idempotency logic in packages/domain/reminders never needs to change,
// because it doesn't know or care who invoked it.

export interface JobHandle {
  id: string;
  cancel(): Promise<void>;
}

export interface JobScheduler {
  scheduleRecurring(name: string, cronExpression: string, handler: () => Promise<void>): JobHandle;
  scheduleOnce(name: string, runAt: Date, handler: () => Promise<void>): JobHandle;
}

// Phase 1 implements: VercelCronScheduler (wraps Vercel Cron + API routes)
// Phase 2 implements: BullMqScheduler (Redis-backed, for real polling volume)
