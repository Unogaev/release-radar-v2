import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  await prisma.alert.update({
    where: { id: params.id },
    data: { sentAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
