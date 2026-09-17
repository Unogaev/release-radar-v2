import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO = "[DEMO]";

interface DemoItem {
  brand: string;
  model: string;
  category: string;
  variantLabel: string;
  status: string;
  rationale: string;
  blockedReasons: string[];
  evidenceConfidence: number;
}

const ITEMS: DemoItem[] = [
  { brand: `${DEMO} Sony`, model: "GTA VI DualSense Controller — Black", category: "gaming", variantLabel: "default", status: "WATCH", rationale: "Анонсирован, но официальная дата и цена ещё не подтверждены. Недоступен к заказу.", blockedReasons: ["Нет подтверждённой даты релиза", "Товар недоступен к заказу"], evidenceConfidence: 35 },
  { brand: `${DEMO} Nintendo`, model: "Zelda Pro Controller", category: "gaming", variantLabel: "default", status: "WATCH", rationale: "Статус страницы — Coming Soon. Ждём открытия предзаказа.", blockedReasons: ["Coming Soon — предзаказ ещё не открыт"], evidenceConfidence: 40 },
  { brand: `${DEMO} Microsoft`, model: "Xbox Series X25", category: "gaming", variantLabel: "default", status: "WATCH", rationale: "Слух из надёжного источника, официального подтверждения пока нет.", blockedReasons: ["Только уровень E1 (слух), нет официального источника"], evidenceConfidence: 25 },
  { brand: `${DEMO} Jordan Brand`, model: "Mowalola × Air Jordan 14", category: "sneakers", variantLabel: "US 10", status: "PREPARE", rationale: "Дата и время релиза официально подтверждены. Нужно подготовить аккаунт и способ оплаты заранее.", blockedReasons: ["Раздел покупки ещё не открыт"], evidenceConfidence: 70 },
  { brand: `${DEMO} ColdSins`, model: "Slashers Collection", category: "collectibles", variantLabel: "default", status: "PREPARE", rationale: "Официально анонсирован дроп на независимом сайте бренда. Требуется мониторинг открытия магазина.", blockedReasons: ["Точное время открытия магазина не подтверждено"], evidenceConfidence: 60 },
  { brand: `${DEMO} Rolex`, model: "Perpetual Padellone", category: "watches", variantLabel: "default", status: "CLIENT_FIRST", rationale: "Высокая цена и ограниченный тираж — экономика оправдана только при наличии подтверждённого клиента.", blockedReasons: ["Требуется депозит клиента перед закупкой"], evidenceConfidence: 55 },
  { brand: `${DEMO} Apple`, model: "iPhone Duo", category: "technology", variantLabel: "default", status: "PREPARE", rationale: "Дата презентации подтверждена официально. Открытие предзаказа ожидается вскоре после презентации.", blockedReasons: ["Предзаказ ещё не открыт"], evidenceConfidence: 65 },
  { brand: `${DEMO} Target`, model: "Verified Clearance — Lego Icons Set", category: "collectibles", variantLabel: "default", status: "VERIFY", rationale: "Обнаружена подтверждённая уценка в конкретном магазине. Требуется проверка наличия на месте перед покупкой.", blockedReasons: ["Наличие подтверждено только по одному магазину"], evidenceConfidence: 72 },
  { brand: `${DEMO} Best Buy`, model: "Rejected Candidate — PS5 Pro Bundle", category: "gaming", variantLabel: "default", status: "SKIP", rationale: "Кнопка добавления в корзину недоступна, реальная проверка checkout не пройдена — риск ложного BUY_NOW.", blockedReasons: ["Нет подтверждённого live CTA/checkout", "Только метаданные страницы"], evidenceConfidence: 20 },
];

async function main() {
  for (const item of ITEMS) {
    const normalizedModel = item.model.toLowerCase();
    let product = await prisma.product.findFirst({ where: { brand: item.brand, normalizedModel, category: item.category } });
    if (!product) product = await prisma.product.create({ data: { brand: item.brand, normalizedModel, category: item.category } });

    let variant = await prisma.productVariant.findFirst({ where: { productId: product.id, variantLabel: item.variantLabel } });
    if (!variant) variant = await prisma.productVariant.create({ data: { productId: product.id, variantLabel: item.variantLabel } });

    const existingDecision = await prisma.decision.findFirst({ where: { productVariantId: variant.id } });
    if (existingDecision) { console.log(`Skip (exists): ${item.brand} ${item.model}`); continue; }

    await prisma.decision.create({
      data: {
        productVariantId: variant.id,
        status: item.status,
        ruleVersion: "demo-2.0.0",
        rationale: item.rationale,
        blockedReasons: item.blockedReasons,
        evidenceConfidence: item.evidenceConfidence,
      },
    });
    console.log(`Created: ${item.brand} ${item.model} — ${item.status}`);
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
