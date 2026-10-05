import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const ACTIVE = ["offered", "accepted", "sourcing", "purchased"];

// POST /api/requests/[id]/accept — runner accepts an open request
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireUserId();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const request = await prisma.clientRequest.findUnique({
    where: { id: params.id },
    include: { tasks: true },
  });
  if (!request) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (request.status !== "open") {
    return NextResponse.json({ error: "request is not open" }, { status: 409 });
  }
  if (request.tasks.some((t) => ACTIVE.includes(t.status))) {
    return NextResponse.json({ error: "request already has an active task" }, { status: 409 });
  }
  const str = (v: unknown, max: number): string | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s ? s.slice(0, max) : null;
  };
  const task = await prisma.runnerTask.create({
    data: {
      clientRequestId: request.id,
      runnerName: str(body.runnerName, 100),
      runnerContact: str(body.runnerContact, 200),
      agreedFeeUsd: body.agreedFeeUsd != null && body.agreedFeeUsd !== "" ? Number(body.agreedFeeUsd) : null,
      agreedMaxPriceUsd:
        body.agreedMaxPriceUsd != null && body.agreedMaxPriceUsd !== ""
          ? Number(body.agreedMaxPriceUsd)
          : request.maxPriceUsd,
      status: "accepted",
    },
  });
  await prisma.clientRequest.update({ where: { id: request.id }, data: { status: "matched" } });
  return NextResponse.json({ task }, { status: 201 });
}
