// apps/web/scripts/seedOwner.ts
//
// The only way to create an account. Run once, locally, with your own
// email/password in environment variables. There is no public sign-up page
// — this is intentional (see lib/auth.ts comment).
//
// Usage:
//   OWNER_EMAIL="you@example.com" OWNER_PASSWORD="your-password" npx tsx scripts/seedOwner.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    console.error("Set OWNER_EMAIL and OWNER_PASSWORD environment variables first.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { passwordHash },
    create: { email: email.toLowerCase().trim(), passwordHash },
  });

  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      categories: [],
      brands: [],
      shoeSizes: [],
      apparelSizes: [],
      purchaseCountries: ["US"],
      goal: "self",
      notificationChannels: ["telegram"],
      allowedRetailers: [],
    },
  });

  console.log(`Owner account ready: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
