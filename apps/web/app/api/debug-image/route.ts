import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "nike air max pulse";
  const out: Record<string, unknown> = { query: q };

  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    out.tokenStatus = tokenRes.status;
    const html = await tokenRes.text();
    out.htmlLength = html.length;
    const match = html.match(/vqd=['"]?([\d-]+)['"]?/);
    out.vqd = match?.[1] ?? null;

    if (match?.[1]) {
      const imgRes = await fetch(
        `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(q)}&vqd=${match[1]}&f=,,,,,&p=1`,
        { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://duckduckgo.com/" } }
      );
      out.imgStatus = imgRes.status;
      const text = await imgRes.text();
      out.imgBodyPreview = text.slice(0, 300);
    }
  } catch (e) {
    out.error = String(e);
  }

  return NextResponse.json(out);
}
