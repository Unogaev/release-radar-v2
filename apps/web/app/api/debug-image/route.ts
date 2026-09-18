import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "nike air max pulse";
  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  if (!key || !cx) {
    return NextResponse.json({ error: "missing key or cx", hasKey: !!key, hasCx: !!cx });
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(
    q
  )}&searchType=image&num=1&safe=active`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    return NextResponse.json({
      query: q,
      status: res.status,
      ok: res.ok,
      raw: text.slice(0, 1500),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
