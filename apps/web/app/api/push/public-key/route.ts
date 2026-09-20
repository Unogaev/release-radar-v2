import { NextResponse } from "next/server";
import { pushConfigured, pushPublicKey } from "@/lib/notifications/push";

export async function GET() {
  return NextResponse.json({ configured: pushConfigured(), publicKey: pushPublicKey() });
}
