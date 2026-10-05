import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/requests — list open client requests (newest first)
export async function GET() {
  await requireUserId();
  const requests = await prisma.clientRequest.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: { tasks: { select: { id: true, status: true } } },
  });
  return NextResponse.json({ requests });
}

// POST /api/requests — create a client request
export async function POST(req: Request) {
  await requireUserId();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (v: unknown, max: number): string | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s ? s.slice(0, max) : null;
  };
  const title = str(body.title, 200);
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const request = await prisma.clientRequest.create({
    data: {
      title,
      brand: str(body.brand, 100),
      model: str(body.model, 200),
      identifier: str(body.identifier, 100),
      maxPriceUsd: body.maxPriceUsd != null && body.maxPriceUsd !== "" ? Number(body.maxPriceUsd) : null,
      quantity: body.quantity != null ? Math.max(1, Math.min(99, parseInt(String(body.quantity), 10) || 1)) : 1,
      region: str(body.region, 50),
      zip: str(body.zip, 20),
      deadlineAt: body.deadlineAt ? new Date(String(body.deadlineAt)) : null,
      notes: str(body.notes, 2000),
      clientName: str(body.clientName, 100),
      clientContact: str(body.clientContact, 200),
      decisionId: str(body.decisionId, 100),
      productVariantId: str(body.productVariantId, 100),
    },
  });
  return NextResponse.json({ request }, { status: 201 });
}
