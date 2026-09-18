// apps/web/middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  // Everything except /login, NextAuth's own API routes, the temp debug route, and static assets
  // requires a session. This is the actual access gate — not a suggestion.
  matcher: ["/((?!login|api/auth|api/debug-image|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
