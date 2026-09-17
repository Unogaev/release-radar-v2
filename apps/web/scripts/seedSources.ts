import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCES = [
  {
    name: "PlayStation Blog",
    sourceClass: "A_truth",
    url: "https://blog.playstation.com/feed/",
    category: "gaming",
    sourceType: "NEWSROOM",
    trustLevel: 5,
    checkIntervalMinutes: 60,
  },
  {
    name: "Xbox Wire",
    sourceClass: "A_truth",
    url: "https://news.xbox.com/en-us/feed/",
    category: "gaming",
    sourceType: "NEWSROOM",
    trustLevel: 5,
    checkIntervalMinutes: 60,
  },
  {
    name: "Sneaker News",
    sourceClass: "C_signal",
    url: "https://sneakernews.com/feed/",
    category: "sneakers",
    sourceType: "RSS",
    trustLevel: 3,
    checkIntervalMinutes: 60,
  },
  {
    name: "Hypebeast",
    sourceClass: "C_signal",
    url: "https://hypebeast.com/feed",
    category: "streetwear",
    sourceType: "RSS",
    trustLevel: 3,
    checkIntervalMinutes: 60,
  },
];

async function main() {
  for (const s of SOURCES) {
    const existing = await prisma.source.findFirst({ where: { name: s.name } });
    if (existing) {
      console.log(`Skip (exists): ${s.name}`);
      continue;
    }
    await prisma.source.create({
      data: {
        name: s.name,
        sourceClass: s.sourceClass,
        url: s.url,
        parseVersion: "collector-v1",
        category: s.category,
        sourceType: s.sourceType,
        trustLevel: s.trustLevel,
        checkIntervalMinutes: s.checkIntervalMinutes,
        isEnabled: true,
      },
    });
    console.log(`Created: ${s.name}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
