// apps/web/middleware.ts
//
// The login gate is removed: every page and action works for visitors with
// no session. This middleware is intentionally a pass-through — it lets all
// requests through and never redirects to /login.
import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
