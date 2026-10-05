import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/requests/[id] — request detail with tasks
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await requireUserId();
  const request = await prisma.clientRequest.findUnique({
    where: { id: params.id },
    include: { tasks: { orderBy: { createdAt: "desc" } } },
  });
  if (!request) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ request });
}
