// apps/web/lib/prisma.ts
import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Cache on globalThis in every environment. Without this, each serverless
// instance creates its own client and the database connection pool is
// exhausted under concurrent load (intermittent 500s in production).
globalForPrisma.prisma = prisma;
