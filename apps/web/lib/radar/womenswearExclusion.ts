// Исключение женской одежды и обуви из радарного фида.
//
// Тематика радара — high-ticket flips: кроссовки/стритвир, часы, техника/GPU,
// TCG, LEGO и коллекционные товары, люкс. Женская мода — оффтопик по прямой
// директиве пользователя, поэтому правило охватывает ВСЮ женскую одежду
// и обувь, а не только платья/юбки/каблуки, как раньше.
//
// Товар исключается, когда он ЯВНО женский И это одежда/обувь:
//  - гендерные маркеры: women's / womens / wmns / women / woman / ladies;
//  - бренд-маркеры женских брендов: SKIMS (в заголовках встречается
//    и слитно: NikeSKIMS) — работают как гендерный маркер;
//  - одежда/обувь: типы одежды и обуви в названии товара или в
//    product_type каталога Shopify (clothing, dresses, shoes, sneakers,
//    outerwear и т.п.);
//  - заведомо женские категории исключаются и без маркера: платья,
//    вечерние наряды, юбки, туфли на каблуке, бельё, купальники,
//    корсеты, а также женские линейки обуви (Mayze, Air Rift и т.п.).
//
// ЖЁСТКИЕ ИСКЛЮЧЕНИЯ — не исключаются никогда, даже с женским маркером:
// часы, ювелирные изделия, сумки/тоуты/рюкзаки, техника и электроника.
//
// Кроссовки — особый случай: исключаются только при явном женском маркере
// И если модель — не известный унисекс (Air Force 1, Dunk, Samba, Gazelle,
// 990 и т.п.). Сомнительные кроссовки остаются в фиде и выносятся в отчёт
// как пограничные, а не удаляются молча. Косметика правилом не трогается.

const WOMEN_MARKER_RE = /\b(wmns|women'?s?|woman'?s?|ladies)\b/i;

// Женские бренды: маркер работает как гендерный (см. шапку).
const WOMENS_BRAND_RE = /skims/i;

const HARD_EXCEPTION_RE =
  /\b(watches|watch|smartwatch|timepieces?|jewellery|jewelry|necklaces?|bracelets?|earrings?|pendants?|brooch(es)?|anklets?|rings?|handbags?|bags?|totes?|backpacks?|clutch(es)?|satchels?|crossbody|purses?|wallets?|headphones?|earbuds?|airpods|speakers?|smartphones?|iphone|phone cases?|laptops?|tablets?|chargers?|consoles?|controllers?|cameras?|graphics cards?|gpu)\b/i;

const INHERENTLY_FEMALE_RE =
  /\b(dress(es)?|gowns?|ballgowns?|nightgowns?|skirts?|heels?|pumps?|ballet flats?|mary janes?|lingerie|leotards?|corsets?|bustiers?|bikinis?|swimsuits?|brassieres?|bras?)\b/i;

const WOMENS_ONLY_SHOE_RE = /(mayze|air rift|air max excee|air max bella|zoom bella|puma cali|fenty)/i;

const FOOTWEAR_RE =
  /\b(sneakers?|trainers?|shoes?|footwear|boots?|booties|sandals?|flats?|loafers?|mules?|clogs?|wedges?|espadrilles?|slippers?|runners?|ballet)\b/i;

const KNOWN_UNISEX_SNEAKER_RE =
  /(air force 1|air jordan|jordan \d|jordan retro|\bdunk\b|samba|gazelle|superstar|stan smith|chuck taylor|chuck 70|old skool|sk8-hi|air max|vapormax|blazer mid|\bcortez\b|pegasus|vomero|ultra ?boost|\bnmd\b|yeezy|\bforum\b|\bcampus\b|spezial|gel-kayano|gel-1130|gel nimbus|asics gel|\b990v?\d?\b|\b991\b|\b992\b|\b993\b|2002r|\b1906[rd]?\b|\b550\b|\b574\b|\b327\b|suede classic|fresh foam|fuelcell)/i;

const APPAREL_RE =
  /\b(clothing|apparel|outerwear|activewear|loungewear|swimwear|tops?|blouses?|shirts?|t-shirts?|tees?|hoodies?|sweatshirts?|sweaters?|cardigans?|jackets?|coats?|blazers?|vests?|knitwear|pants?|trousers?|jeans|denim|shorts?|leggings|tights|joggers|sweatpants|jumpsuits?|rompers?|overalls|tracksuits?|tanks?|underwear|dresses|gowns?|skirts?|jumpers?|wraps?)\b/i;

function evaluateWomenswear(text: string): boolean {
  if (!text) return false;
  // Жёсткие исключения проверяются первыми и не перекрываются ничем.
  if (HARD_EXCEPTION_RE.test(text)) return false;
  // Заведомо женские категории одежды/обуви — без маркера.
  if (INHERENTLY_FEMALE_RE.test(text)) return true;
  if (WOMENS_ONLY_SHOE_RE.test(text)) return true;
  const womens = WOMEN_MARKER_RE.test(text) || WOMENS_BRAND_RE.test(text);
  // Обувь (включая кроссовки): только с явным женским маркером и только
  // если модель — не известный унисекс.
  if (FOOTWEAR_RE.test(text) || KNOWN_UNISEX_SNEAKER_RE.test(text)) {
    return womens && !KNOWN_UNISEX_SNEAKER_RE.test(text);
  }
  // Остальная одежда: нужен и маркер, и тип одежды.
  return womens && APPAREL_RE.test(text);
}

/**
 * Правило уровня фида: по названию товара (бренд + модель).
 * Возвращает true для всей явно женской одежды и обуви с учётом
 * жёстких исключений (часы, ювелирка, сумки, техника, унисекс-кроссовки).
 */
export function isWomenswearTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  return evaluateWomenswear(title);
}

/**
 * Правило уровня инжеста: product_type и название товара
 * из products.json оцениваются вместе (маркер может быть в одном поле,
 * а тип одежды/обуви — в другом). Порядок аргументов: (productType, title).
 */
export function isWomenswearProduct(
  productType: string | null | undefined,
  title: string | null | undefined,
): boolean {
  return evaluateWomenswear(`${productType ?? ""} ${title ?? ""}`);
}
