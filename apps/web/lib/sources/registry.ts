import type { PrismaClient } from "../../generated/prisma";

export type RadarSourceDefinition = {
  name: string;
  sourceClass: "A_truth" | "B_market" | "C_signal";
  url: string;
  category: string;
  sourceType: "RSS" | "NEWSROOM" | "MANUAL";
  trustLevel: number;
  checkIntervalMinutes?: number;
};

// The registry deliberately mixes official newsrooms (truth), specialist
// editorial feeds (discovery), and manual official pages that do not expose a
// usable feed. A headline is only a discovery signal; it never becomes BUY NOW
// without separate availability, price and completed-sale evidence.
export const RADAR_SOURCE_REGISTRY: RadarSourceDefinition[] = [
  // Gaming / consoles
  { name: "PlayStation Blog", sourceClass: "A_truth", url: "https://blog.playstation.com/feed/", category: "gaming", sourceType: "NEWSROOM", trustLevel: 5 },
  { name: "Xbox Wire", sourceClass: "A_truth", url: "https://news.xbox.com/en-us/feed/", category: "gaming", sourceType: "NEWSROOM", trustLevel: 5 },
  { name: "Nintendo Official News", sourceClass: "A_truth", url: "https://www.nintendo.com/us/whatsnew/", category: "gaming", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Best Buy Xbox X25", sourceClass: "A_truth", url: "https://www.bestbuy.com/site/searchpage.jsp?st=xbox+x25", category: "gaming", sourceType: "MANUAL", trustLevel: 5 },

  // Technology, GPU, cameras and first-generation devices
  { name: "Apple Newsroom", sourceClass: "A_truth", url: "https://www.apple.com/newsroom/rss-feed.rss", category: "technology", sourceType: "NEWSROOM", trustLevel: 5 },
  { name: "Google Blog", sourceClass: "A_truth", url: "https://blog.google/rss/", category: "technology", sourceType: "NEWSROOM", trustLevel: 5 },
  { name: "Microsoft Blog", sourceClass: "A_truth", url: "https://blogs.microsoft.com/feed/", category: "technology", sourceType: "NEWSROOM", trustLevel: 5 },
  { name: "NVIDIA Blog", sourceClass: "A_truth", url: "https://blogs.nvidia.com/blog/feed/", category: "gpu", sourceType: "NEWSROOM", trustLevel: 5 },
  { name: "Samsung Global Newsroom", sourceClass: "A_truth", url: "https://news.samsung.com/global/feed", category: "technology", sourceType: "NEWSROOM", trustLevel: 5 },
  { name: "The Verge", sourceClass: "C_signal", url: "https://www.theverge.com/rss/index.xml", category: "technology", sourceType: "RSS", trustLevel: 4 },
  { name: "Engadget", sourceClass: "C_signal", url: "https://www.engadget.com/rss.xml", category: "technology", sourceType: "RSS", trustLevel: 4 },
  { name: "DPReview", sourceClass: "C_signal", url: "https://www.dpreview.com/feeds/news.xml", category: "cameras", sourceType: "RSS", trustLevel: 4 },
  { name: "PetaPixel", sourceClass: "C_signal", url: "https://petapixel.com/feed/", category: "cameras", sourceType: "RSS", trustLevel: 4 },

  // Sneakers / streetwear
  { name: "Nike SNKRS", sourceClass: "A_truth", url: "https://www.nike.com/launch", category: "sneakers", sourceType: "MANUAL", trustLevel: 5 },
  { name: "adidas Confirmed", sourceClass: "A_truth", url: "https://www.adidas.com/us/confirmed", category: "sneakers", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Sneaker News", sourceClass: "C_signal", url: "https://sneakernews.com/feed/", category: "sneakers", sourceType: "RSS", trustLevel: 3 },
  { name: "Nice Kicks", sourceClass: "C_signal", url: "https://www.nicekicks.com/feed/", category: "sneakers", sourceType: "RSS", trustLevel: 3 },
  { name: "Hypebeast", sourceClass: "C_signal", url: "https://hypebeast.com/feed", category: "streetwear", sourceType: "RSS", trustLevel: 3 },
  { name: "Highsnobiety", sourceClass: "C_signal", url: "https://www.highsnobiety.com/feed/", category: "streetwear", sourceType: "RSS", trustLevel: 3 },

  // Independent and collectible watches
  { name: "Hodinkee", sourceClass: "C_signal", url: "https://www.hodinkee.com/articles/rss.xml", category: "watches", sourceType: "RSS", trustLevel: 4 },
  { name: "Fratello Watches", sourceClass: "C_signal", url: "https://www.fratellowatches.com/feed/", category: "watches", sourceType: "RSS", trustLevel: 4 },
  { name: "Monochrome Watches", sourceClass: "C_signal", url: "https://monochrome-watches.com/feed/", category: "watches", sourceType: "RSS", trustLevel: 4 },
  { name: "Konstantin Chaykin Official", sourceClass: "A_truth", url: "https://chaykin.ru/en/news/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "MB&F Official", sourceClass: "A_truth", url: "https://www.mbandf.com/en/machines/legacy-machines", category: "watches", sourceType: "MANUAL", trustLevel: 5 },

  // Cars / EV / rare allocations
  { name: "Electrek", sourceClass: "C_signal", url: "https://electrek.co/feed/", category: "cars", sourceType: "RSS", trustLevel: 4 },
  { name: "InsideEVs", sourceClass: "C_signal", url: "https://insideevs.com/rss/news/all/", category: "cars", sourceType: "RSS", trustLevel: 4 },
  { name: "Motor1", sourceClass: "C_signal", url: "https://www.motor1.com/rss/news/all/", category: "cars", sourceType: "RSS", trustLevel: 4 },
  { name: "Carscoops", sourceClass: "C_signal", url: "https://www.carscoops.com/feed/", category: "cars", sourceType: "RSS", trustLevel: 3 },
  { name: "Porsche USA Finder", sourceClass: "A_truth", url: "https://finder.porsche.com/us/en-US", category: "cars", sourceType: "MANUAL", trustLevel: 5 },

  // LEGO, collectibles and sports memorabilia
  { name: "The Brothers Brick", sourceClass: "C_signal", url: "https://www.brothers-brick.com/feed/", category: "lego", sourceType: "RSS", trustLevel: 4 },
  { name: "Brickset", sourceClass: "C_signal", url: "https://brickset.com/feed", category: "lego", sourceType: "RSS", trustLevel: 4 },
  { name: "Toyark", sourceClass: "C_signal", url: "https://www.toyark.com/feed", category: "collectibles", sourceType: "RSS", trustLevel: 3 },
  { name: "Beckett Collectibles", sourceClass: "C_signal", url: "https://www.beckett.com/news/feed/", category: "collectibles", sourceType: "RSS", trustLevel: 3 },

  // Luxury, vintage, bags and jewelry
  { name: "Robb Report Style", sourceClass: "C_signal", url: "https://robbreport.com/style/feed/", category: "luxury", sourceType: "RSS", trustLevel: 3 },
  { name: "PurseBlog", sourceClass: "C_signal", url: "https://www.purseblog.com/feed/", category: "luxury", sourceType: "RSS", trustLevel: 3 },
  { name: "Fashionista", sourceClass: "C_signal", url: "https://fashionista.com/.rss/full/", category: "vintage", sourceType: "RSS", trustLevel: 3 },
  { name: "Chrome Hearts Official", sourceClass: "A_truth", url: "https://www.chromehearts.com/", category: "chrome-hearts", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Van Cleef & Arpels US", sourceClass: "A_truth", url: "https://www.vancleefarpels.com/us/en/home.html", category: "jewelry", sourceType: "MANUAL", trustLevel: 5 },

  // Fragrance
  { name: "Now Smell This", sourceClass: "C_signal", url: "https://nstperfume.com/feed/", category: "fragrance", sourceType: "RSS", trustLevel: 3 },
  { name: "Perfume Posse", sourceClass: "C_signal", url: "https://perfumeposse.com/feed/", category: "fragrance", sourceType: "RSS", trustLevel: 3 },

  // Clearance discovery only; retailer page/app must still verify local price and stock.
  { name: "Slickdeals Frontpage", sourceClass: "C_signal", url: "https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1", category: "clearance", sourceType: "RSS", trustLevel: 2 },
  { name: "Target Clearance (33160)", sourceClass: "A_truth", url: "https://www.target.com/c/clearance/-/N-5q0ga", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Best Buy Outlet", sourceClass: "A_truth", url: "https://www.bestbuy.com/site/electronics/outlet-refurbished-clearance/pcmcat142300050026.c", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
];

export async function ensureRadarSourceRegistry(prisma: PrismaClient): Promise<void> {
  const existingSources = await prisma.source.findMany({
    where: { name: { in: RADAR_SOURCE_REGISTRY.map((source) => source.name) } },
  });
  const existingByName = new Map(existingSources.map((source) => [source.name, source]));
  const writes = [];
  for (const source of RADAR_SOURCE_REGISTRY) {
    const existing = existingByName.get(source.name);
    const data = {
      sourceClass: source.sourceClass,
      url: source.url,
      parseVersion: "collector-v2",
      category: source.category,
      sourceType: source.sourceType,
      trustLevel: source.trustLevel,
      checkIntervalMinutes: source.checkIntervalMinutes ?? 60,
      isEnabled: true,
    };
    if (existing) {
      const changed =
        existing.sourceClass !== data.sourceClass ||
        existing.url !== data.url ||
        existing.parseVersion !== data.parseVersion ||
        existing.category !== data.category ||
        existing.sourceType !== data.sourceType ||
        existing.trustLevel !== data.trustLevel ||
        existing.checkIntervalMinutes !== data.checkIntervalMinutes ||
        !existing.isEnabled;
      if (changed) writes.push(prisma.source.update({ where: { id: existing.id }, data }));
    } else {
      writes.push(prisma.source.create({
        data: {
          name: source.name,
          ...data,
          adapterStatus: source.sourceType === "MANUAL" ? "manual" : "active",
        },
      }));
    }
  }
  if (writes.length) await prisma.$transaction(writes);
}
