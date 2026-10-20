// apps/web/lib/session.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (userId) return userId;
  // No session: the app is open to visitors. Fall back to the owner — the
  // earliest-created user (the single real user of the app) — so pages and
  // actions read the owner's data instead of redirecting to /login.
  const owner = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!owner) throw new Error("requireUserId: no users in the database");
  return owner.id;
}
