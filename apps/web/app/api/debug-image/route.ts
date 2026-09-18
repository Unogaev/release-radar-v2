import { NextRequest, NextResponse } from "next/server";
import { getProductImage } from "@/lib/radar/fetchImage";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "nike air max pulse";
  const [brand, ...rest] = q.split(" ");
  try {
    const url = await getProductImage(brand, rest.join(" "));
    return NextResponse.json({ query: q, url, hasKey: !!process.env.GOOGLE_CSE_KEY, hasCx: !!process.env.GOOGLE_CSE_CX });
  } catch (e) {
    return NextResponse.json({ query: q, error: String(e) }, { status: 500 });
  }
}
