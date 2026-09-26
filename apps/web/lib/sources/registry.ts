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
  { name: "Best Buy Xbox X25", sourceClass: "A_truth", url: "https://www.bestbuy.com/site/searchpage.jsp?st=xbox+x25", category: "gaming", sourceType: "MANUAL", trustLevel: 5, checkIntervalMinutes: 15 },
  { name: "Rockstar Games Newswire", sourceClass: "A_truth", url: "https://www.rockstargames.com/newswire", category: "gaming", sourceType: "MANUAL", trustLevel: 5 },
  { name: "PlayStation Direct", sourceClass: "A_truth", url: "https://direct.playstation.com/en-us", category: "gaming", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Microsoft Store Xbox", sourceClass: "A_truth", url: "https://www.microsoft.com/en-us/store/b/xbox", category: "gaming", sourceType: "MANUAL", trustLevel: 5, checkIntervalMinutes: 15 },
  { name: "GameStop Consoles", sourceClass: "A_truth", url: "https://www.gamestop.com/consoles-hardware", category: "gaming", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Target Xbox", sourceClass: "A_truth", url: "https://www.target.com/c/xbox-series-x-s-consoles-video-games/-/N-fd2hh", category: "gaming", sourceType: "MANUAL", trustLevel: 5 },

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
  { name: "AMD Newsroom", sourceClass: "A_truth", url: "https://www.amd.com/en/newsroom.html", category: "gpu", sourceType: "MANUAL", trustLevel: 5 },
  { name: "NVIDIA GeForce Store", sourceClass: "A_truth", url: "https://marketplace.nvidia.com/en-us/consumer/graphics-cards/", category: "gpu", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Best Buy Graphics Cards", sourceClass: "A_truth", url: "https://www.bestbuy.com/site/computer-cards-components/video-graphics-cards/abcat0507002.c", category: "gpu", sourceType: "MANUAL", trustLevel: 5 },
  { name: "B&H Graphics Cards", sourceClass: "A_truth", url: "https://www.bhphotovideo.com/c/browse/Graphic-Cards/ci/6567", category: "gpu", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Micro Center Graphics Cards", sourceClass: "A_truth", url: "https://www.microcenter.com/category/4294966937/graphics-cards", category: "gpu", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Newegg Graphics Cards", sourceClass: "A_truth", url: "https://www.newegg.com/GPUs-Video-Graphics-Cards/SubCategory/ID-48", category: "gpu", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Sony Electronics News", sourceClass: "A_truth", url: "https://www.sony.com/en/SonyInfo/News/Press/", category: "technology", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Meta Newsroom", sourceClass: "A_truth", url: "https://about.fb.com/news/", category: "technology", sourceType: "MANUAL", trustLevel: 5 },
  { name: "DJI Newsroom", sourceClass: "A_truth", url: "https://www.dji.com/newsroom", category: "cameras", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Canon USA News", sourceClass: "A_truth", url: "https://www.usa.canon.com/newsroom", category: "cameras", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Nikon USA Press", sourceClass: "A_truth", url: "https://www.nikonusa.com/press-room", category: "cameras", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Fujifilm News", sourceClass: "A_truth", url: "https://www.fujifilm.com/us/en/news", category: "cameras", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Leica Camera News", sourceClass: "A_truth", url: "https://leica-camera.com/en-US/press-centre", category: "cameras", sourceType: "MANUAL", trustLevel: 5 },

  // Sneakers / streetwear
  { name: "Nike SNKRS", sourceClass: "A_truth", url: "https://www.nike.com/launch", category: "sneakers", sourceType: "MANUAL", trustLevel: 5, checkIntervalMinutes: 15 },
  { name: "adidas Confirmed", sourceClass: "A_truth", url: "https://www.adidas.com/us/confirmed", category: "sneakers", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Sneaker News", sourceClass: "C_signal", url: "https://sneakernews.com/feed/", category: "sneakers", sourceType: "RSS", trustLevel: 3 },
  { name: "Nice Kicks", sourceClass: "C_signal", url: "https://www.nicekicks.com/feed/", category: "sneakers", sourceType: "RSS", trustLevel: 3 },
  { name: "Hypebeast", sourceClass: "C_signal", url: "https://hypebeast.com/feed", category: "streetwear", sourceType: "RSS", trustLevel: 3 },
  { name: "Highsnobiety", sourceClass: "C_signal", url: "https://www.highsnobiety.com/feed/", category: "streetwear", sourceType: "RSS", trustLevel: 3 },

  // Public/indexed early-demand layer. These searches catch coverage of
  // athlete/celebrity debuts, buyer requests, pop-ups and surprise drops.
  // They are discovery-only and always enter the product as VERIFY; an
  // official retailer and market evidence must independently confirm action.
  { name: "Early Pulse — Surprise Drops", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%22surprise+drop%22+OR+%22pop-up%22+OR+%22unannounced+release%22&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },
  { name: "Early Pulse — Athlete Debuts", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%22on-court+debut%22+OR+%22player+exclusive%22+OR+%22signature+shoe%22&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },
  { name: "Early Pulse — Celebrity Wears", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%22spotted+in%22+OR+%22seen+wearing%22+OR+%22celebrity+wore%22+sneakers+fashion+watch&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },
  { name: "Early Pulse — Sellouts & Restocks", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%22sold+out%22+OR+restock+OR+%22back+in+stock%22+limited+edition&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },

  // Social watch desk. Instagram and X posts are discovery evidence only:
  // these indexed searches watch established release reporters, collectors,
  // athletes and buyer-facing dealers without pretending a social post is
  // proof of stock, price or a completed sale.
  { name: "Social Watch — Sneaker Insiders", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%22DropsByJay%22+OR+%22KicksFinder%22+OR+%22Sole+Retriever%22+OR+%22Supreme+Leaks+News%22+OR+%22zsneakerheadz%22+drop+OR+restock&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },
  { name: "Social Watch — Athletes & Celebrity Debuts", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%22on+feet%22+OR+%22courtside%22+OR+%22player+exclusive%22+OR+%22first+wore%22+%28sneaker+OR+watch+OR+fashion%29&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },
  { name: "Social Watch — Watch Collectors & Dealers", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%22Luxury+Bazaar%22+OR+%22Wrist+Aficionado%22+OR+%22A+Collected+Man%22+OR+%22Phillips+Watches%22+limited+OR+auction+OR+sold&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },
  { name: "Social Watch — Chrome Hearts & Archive Buyers", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%22Chrome+Hearts%22+%28restock+OR+%22new+arrival%22+OR+%22sold+out%22+OR+WTB+OR+buyer%29&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },
  { name: "Social Watch — Tech Launch Insiders", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%22Mark+Gurman%22+OR+%22Ming-Chi+Kuo%22+OR+%22Ross+Young%22+%28launch+OR+preorder+OR+limited+supply%29&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },
  { name: "Social Watch — South Florida Buyer Pulse", sourceClass: "C_signal", url: "https://news.google.com/rss/search?q=%28Miami+OR+Aventura+OR+Fort+Lauderdale%29+%28pop-up+OR+restock+OR+raffle+OR+clearance+OR+exclusive%29&hl=en-US&gl=US&ceid=US:en", category: "social-pulse", sourceType: "RSS", trustLevel: 2, checkIntervalMinutes: 15 },

  // Independent and collectible watches
  { name: "Hodinkee", sourceClass: "C_signal", url: "https://www.hodinkee.com/articles/rss.xml", category: "watches", sourceType: "RSS", trustLevel: 4 },
  { name: "Fratello Watches", sourceClass: "C_signal", url: "https://www.fratellowatches.com/feed/", category: "watches", sourceType: "RSS", trustLevel: 4 },
  { name: "Monochrome Watches", sourceClass: "C_signal", url: "https://monochrome-watches.com/feed/", category: "watches", sourceType: "RSS", trustLevel: 4 },
  { name: "Konstantin Chaykin Official", sourceClass: "A_truth", url: "https://chaykin.ru/en/news/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "MB&F Official", sourceClass: "A_truth", url: "https://www.mbandf.com/en/machines/legacy-machines", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "F.P. Journe Official", sourceClass: "A_truth", url: "https://www.fpjourne.com/en", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "De Bethune Official", sourceClass: "A_truth", url: "https://www.debethune.ch/en/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "H. Moser Official", sourceClass: "A_truth", url: "https://h-moser.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Urwerk Official", sourceClass: "A_truth", url: "https://www.urwerk.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Greubel Forsey Official", sourceClass: "A_truth", url: "https://www.greubelforsey.com/en", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Czapek Official", sourceClass: "A_truth", url: "https://czapek.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Laurent Ferrier Official", sourceClass: "A_truth", url: "https://laurentferrier.ch/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Ressence Official", sourceClass: "A_truth", url: "https://ressencewatches.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "MING Watches", sourceClass: "A_truth", url: "https://www.ming.watch/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Kurono Tokyo", sourceClass: "A_truth", url: "https://kuronotokyo.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Louis Erard", sourceClass: "A_truth", url: "https://louiserard.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Baltic Watches", sourceClass: "A_truth", url: "https://baltic-watches.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Christopher Ward", sourceClass: "A_truth", url: "https://www.christopherward.com/int/home", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Studio Underd0g", sourceClass: "A_truth", url: "https://underd0g.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Anordain", sourceClass: "A_truth", url: "https://anordain.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Massena LAB", sourceClass: "A_truth", url: "https://massenalab.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Habring2", sourceClass: "A_truth", url: "https://www.habring2.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Serica Watches", sourceClass: "A_truth", url: "https://www.serica-watches.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Nivada Grenchen", sourceClass: "A_truth", url: "https://nivadagrenchenofficial.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "DOXA Watches", sourceClass: "A_truth", url: "https://doxawatches.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Zodiac Watches", sourceClass: "A_truth", url: "https://www.zodiacwatches.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Grand Seiko US", sourceClass: "A_truth", url: "https://www.grand-seiko.com/us-en/collections", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Cartier Watches", sourceClass: "A_truth", url: "https://www.cartier.com/en-us/watches/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Omega Watches", sourceClass: "A_truth", url: "https://www.omegawatches.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Swatch US", sourceClass: "A_truth", url: "https://www.swatch.com/en-us/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Rolex News", sourceClass: "A_truth", url: "https://newsroom.rolex.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Tudor Watches", sourceClass: "A_truth", url: "https://www.tudorwatch.com/en/watches", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Watches and Wonders", sourceClass: "A_truth", url: "https://www.watchesandwonders.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Geneva Watch Days", sourceClass: "A_truth", url: "https://www.gva-watch-days.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Only Watch", sourceClass: "A_truth", url: "https://www.onlywatch.com/", category: "watches", sourceType: "MANUAL", trustLevel: 5 },

  // Cars / EV / rare allocations
  { name: "Electrek", sourceClass: "C_signal", url: "https://electrek.co/feed/", category: "cars", sourceType: "RSS", trustLevel: 4 },
  { name: "InsideEVs", sourceClass: "C_signal", url: "https://insideevs.com/rss/news/all/", category: "cars", sourceType: "RSS", trustLevel: 4 },
  { name: "Motor1", sourceClass: "C_signal", url: "https://www.motor1.com/rss/news/all/", category: "cars", sourceType: "RSS", trustLevel: 4 },
  { name: "Carscoops", sourceClass: "C_signal", url: "https://www.carscoops.com/feed/", category: "cars", sourceType: "RSS", trustLevel: 3 },
  { name: "Porsche USA Finder", sourceClass: "A_truth", url: "https://finder.porsche.com/us/en-US", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Porsche Newsroom USA", sourceClass: "A_truth", url: "https://newsroom.porsche.com/en_US.html", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Ferrari Media Centre", sourceClass: "A_truth", url: "https://www.ferrari.com/en-US/corporate/media-centre", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Lamborghini Media Center", sourceClass: "A_truth", url: "https://media.lamborghini.com/", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "McLaren Press", sourceClass: "A_truth", url: "https://cars.mclaren.press/", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Aston Martin Media", sourceClass: "A_truth", url: "https://media.astonmartin.com/", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Mercedes-Benz Media", sourceClass: "A_truth", url: "https://media.mbusa.com/", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "BMW USA News", sourceClass: "A_truth", url: "https://www.bmwusanews.com/", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Audi MediaCenter", sourceClass: "A_truth", url: "https://www.audi-mediacenter.com/en", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Land Rover Media", sourceClass: "A_truth", url: "https://media.landrover.com/en-us", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Cadillac News", sourceClass: "A_truth", url: "https://news.cadillac.com/", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Chevrolet News", sourceClass: "A_truth", url: "https://news.chevrolet.com/", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Ford Media Center", sourceClass: "A_truth", url: "https://media.ford.com/content/fordmedia/fna/us/en.html", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Tesla Inventory", sourceClass: "A_truth", url: "https://www.tesla.com/inventory/new/m3", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Lucid Motors News", sourceClass: "A_truth", url: "https://lucidmotors.com/media-room", category: "cars", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Rivian Newsroom", sourceClass: "A_truth", url: "https://rivian.com/newsroom", category: "cars", sourceType: "MANUAL", trustLevel: 5 },

  // LEGO, collectibles and sports memorabilia
  { name: "The Brothers Brick", sourceClass: "C_signal", url: "https://www.brothers-brick.com/feed/", category: "lego", sourceType: "RSS", trustLevel: 4 },
  { name: "Brickset", sourceClass: "C_signal", url: "https://brickset.com/feed", category: "lego", sourceType: "RSS", trustLevel: 4 },
  { name: "Toyark", sourceClass: "C_signal", url: "https://www.toyark.com/feed", category: "collectibles", sourceType: "RSS", trustLevel: 3 },
  { name: "Beckett Collectibles", sourceClass: "C_signal", url: "https://www.beckett.com/news/feed/", category: "collectibles", sourceType: "RSS", trustLevel: 3 },
  { name: "Sports Collectors Daily", sourceClass: "B_market", url: "https://www.sportscollectorsdaily.com/feed/", category: "collectibles", sourceType: "RSS", trustLevel: 4 },
  { name: "Antique Trader", sourceClass: "B_market", url: "https://www.antiquetrader.com/.rss/full/", category: "vintage", sourceType: "RSS", trustLevel: 4 },
  { name: "Heritage Auctions Sports", sourceClass: "B_market", url: "https://sports.ha.com/", category: "collectibles", sourceType: "MANUAL", trustLevel: 4 },
  { name: "Goldin Auctions", sourceClass: "B_market", url: "https://goldin.co/", category: "collectibles", sourceType: "MANUAL", trustLevel: 4 },
  { name: "PSA Auction Prices", sourceClass: "B_market", url: "https://www.psacard.com/auctionprices", category: "collectibles", sourceType: "MANUAL", trustLevel: 4 },
  { name: "LEGO Newsroom", sourceClass: "A_truth", url: "https://www.lego.com/en-us/aboutus/newsroom", category: "lego", sourceType: "MANUAL", trustLevel: 5 },
  { name: "LEGO New Sets", sourceClass: "A_truth", url: "https://www.lego.com/en-us/categories/new-sets-and-products", category: "lego", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Mattel Creations", sourceClass: "A_truth", url: "https://creations.mattel.com/", category: "collectibles", sourceType: "MANUAL", trustLevel: 5 },
  { name: "MEGA Construx", sourceClass: "A_truth", url: "https://creations.mattel.com/collections/mega", category: "lego", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Hasbro Pulse", sourceClass: "A_truth", url: "https://www.hasbropulse.com/", category: "collectibles", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Funko Exclusives", sourceClass: "A_truth", url: "https://funko.com/exclusives/", category: "collectibles", sourceType: "MANUAL", trustLevel: 5 },

  // Luxury, vintage, bags and jewelry
  { name: "Robb Report Style", sourceClass: "C_signal", url: "https://robbreport.com/style/feed/", category: "luxury", sourceType: "RSS", trustLevel: 3 },
  { name: "PurseBlog", sourceClass: "C_signal", url: "https://www.purseblog.com/feed/", category: "luxury", sourceType: "RSS", trustLevel: 3 },
  { name: "Fashionista", sourceClass: "C_signal", url: "https://fashionista.com/.rss/full/", category: "vintage", sourceType: "RSS", trustLevel: 3 },
  { name: "Chrome Hearts Official", sourceClass: "A_truth", url: "https://www.chromehearts.com/", category: "chrome-hearts", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Van Cleef & Arpels US", sourceClass: "A_truth", url: "https://www.vancleefarpels.com/us/en/home.html", category: "jewelry", sourceType: "MANUAL", trustLevel: 5 },
  { name: "The RealReal New Arrivals", sourceClass: "B_market", url: "https://www.therealreal.com/new-arrivals", category: "vintage", sourceType: "MANUAL", trustLevel: 4 },
  { name: "Fashionphile New Arrivals", sourceClass: "B_market", url: "https://www.fashionphile.com/shop/new-arrivals", category: "vintage", sourceType: "MANUAL", trustLevel: 4 },
  { name: "Collector Square Handbags", sourceClass: "B_market", url: "https://www.collectorsquare.com/en/bags/", category: "vintage", sourceType: "MANUAL", trustLevel: 4, checkIntervalMinutes: 60 },
  { name: "Grailed Designers", sourceClass: "B_market", url: "https://www.grailed.com/designers", category: "vintage", sourceType: "MANUAL", trustLevel: 3 },
  { name: "Sotheby's Handbags", sourceClass: "B_market", url: "https://www.sothebys.com/en/buy/handbags", category: "luxury", sourceType: "MANUAL", trustLevel: 4 },
  { name: "Christie's Handbags", sourceClass: "B_market", url: "https://www.christies.com/en/departments/handbags-and-accessories", category: "luxury", sourceType: "MANUAL", trustLevel: 4 },

  // Fragrance
  { name: "Now Smell This", sourceClass: "C_signal", url: "https://nstperfume.com/feed/", category: "fragrance", sourceType: "RSS", trustLevel: 3 },
  { name: "Perfume Posse", sourceClass: "C_signal", url: "https://perfumeposse.com/feed/", category: "fragrance", sourceType: "RSS", trustLevel: 3 },
  { name: "LuckyScent New", sourceClass: "A_truth", url: "https://www.luckyscent.com/new", category: "fragrance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Aedes Perfumery", sourceClass: "A_truth", url: "https://www.aedes.com/", category: "fragrance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Neiman Marcus Fragrance", sourceClass: "A_truth", url: "https://www.neimanmarcus.com/c/beauty-fragrances-cat10470742", category: "fragrance", sourceType: "MANUAL", trustLevel: 5 },

  // Technical apparel and niche sporting equipment
  { name: "Klim New Gear", sourceClass: "A_truth", url: "https://www.klim.com/new", category: "sports", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Simms New Arrivals", sourceClass: "A_truth", url: "https://www.simmsfishing.com/collections/new-arrivals", category: "sports", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Sitka New Arrivals", sourceClass: "A_truth", url: "https://www.sitkagear.com/new-arrivals", category: "sports", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Lynx Gear", sourceClass: "A_truth", url: "https://www.brplynx.com/us/en/gear.html", category: "sports", sourceType: "MANUAL", trustLevel: 5 },

  // Clearance discovery only; retailer page/app must still verify local price and stock.
  { name: "Slickdeals Frontpage", sourceClass: "C_signal", url: "https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1", category: "clearance", sourceType: "RSS", trustLevel: 2 },
  { name: "Target Clearance (33160)", sourceClass: "A_truth", url: "https://www.target.com/c/clearance/-/N-5q0ga", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Best Buy Outlet", sourceClass: "A_truth", url: "https://www.bestbuy.com/site/electronics/outlet-refurbished-clearance/pcmcat142300050026.c", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Walmart Clearance", sourceClass: "A_truth", url: "https://www.walmart.com/shop/deals/clearance", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Costco Clearance", sourceClass: "A_truth", url: "https://www.costco.com/", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Sam's Club Clearance", sourceClass: "A_truth", url: "https://www.samsclub.com/b/clearance/1057", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Home Depot Special Buy", sourceClass: "A_truth", url: "https://www.homedepot.com/SpecialBuy/SpecialBuyOfTheDay", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Lowe's Clearance", sourceClass: "A_truth", url: "https://www.lowes.com/l/shop/clearance", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
  { name: "Nordstrom Rack Clearance", sourceClass: "A_truth", url: "https://www.nordstromrack.com/clearance", category: "clearance", sourceType: "MANUAL", trustLevel: 5 },
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
