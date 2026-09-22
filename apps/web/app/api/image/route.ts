import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isPublicImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    return !(
      host === "localhost" || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1" ||
      /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get("url") ?? "";
  if (!isPublicImageUrl(source)) return new NextResponse("Invalid image URL", { status: 400 });
  try {
    const response = await fetch(source, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
      return new NextResponse("Image unavailable", { status: 404 });
    }
    const body = await response.arrayBuffer();
    if (body.byteLength > 12 * 1024 * 1024) return new NextResponse("Image too large", { status: 413 });
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    return new NextResponse("Image unavailable", { status: 404 });
  }
}
