import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const TRANSITIONS: Record<string, string[]> = {
  offered: ["accepted", "cancelled"],
  accepted: ["sourcing", "cancelled"],
  sourcing: ["purchased", "failed", "cancelled"],
  purchased: ["delivered", "failed"],
  delivered: [],
  failed: [],
  cancelled: [],
};

const ACTIVE = ["offered", "accepted", "sourcing", "purchased"];

// PATCH /api/tasks/[id] — advance task status, attach proof
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await requireUserId();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const task = await prisma.runnerTask.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  const updates: Record<string, unknown> = {};
  if (body.status && body.status !== task.status) {
    const allowed = TRANSITIONS[task.status] ?? [];
    if (!allowed.includes(String(body.status))) {
      return NextResponse.json({ error: `cannot move from ${task.status} to ${body.status}` }, { status: 409 });
    }
    updates.status = String(body.status);
  }
  if (body.receiptUrl !== undefined) {
    const s = body.receiptUrl ? String(body.receiptUrl).trim().slice(0, 500) : "";
    updates.receiptUrl = s || null;
  }
  if (body.receiptAmountUsd !== undefined) {
    updates.receiptAmountUsd = body.receiptAmountUsd != null && body.receiptAmountUsd !== "" ? Number(body.receiptAmountUsd) : null;
  }
  const updated = await prisma.runnerTask.update({ where: { id: task.id }, data: updates });
  if (updates.status === "delivered") {
    await prisma.clientRequest.update({ where: { id: task.clientRequestId }, data: { status: "fulfilled" } });
  } else if (["accepted", "sourcing", "purchased"].includes(String(updates.status))) {
    await prisma.clientRequest.update({ where: { id: task.clientRequestId }, data: { status: "in_progress" } });
  } else if (updates.status === "failed" || updates.status === "cancelled") {
    const remaining = await prisma.runnerTask.count({
      where: { clientRequestId: task.clientRequestId, status: { in: ACTIVE } },
    });
    if (remaining === 0) {
      await prisma.clientRequest.update({ where: { id: task.clientRequestId }, data: { status: "open" } });
    }
  }
  return NextResponse.json({ task: updated });
}
