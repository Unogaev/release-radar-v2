import { PrismaClient } from "../generated/prisma";
import { ensureRadarSourceRegistry, RADAR_SOURCE_REGISTRY } from "../lib/sources/registry";

const prisma = new PrismaClient();

async function main() {
  await ensureRadarSourceRegistry(prisma);
  console.log(`Source registry synchronized: ${RADAR_SOURCE_REGISTRY.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
