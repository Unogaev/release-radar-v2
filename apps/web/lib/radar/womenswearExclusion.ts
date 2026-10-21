// Исключение женской одежды (платья, юбки, вечерние наряды, туфли на каблуке)
// из радарного фида.
//
// Тематика радара — high-ticket flips: кроссовки/стритвир, часы, техника/GPU,
// TCG, LEGO и коллекционные товары, люкс. Женская одежда (платья и т.п.,
// массово приходящие из каталога Dover Street Market) — оффтопик-шум:
// это прямо зафиксировано директивой пользователя.
//
// Правило намеренно узкое и основанное на данных:
//  - product_type каталога Shopify, содержащий dress / gown / skirt / heel;
//  - отдельное слово dress(es) / gown(s) / skirt(s) / heel(s) / pump(s)
//    в названии товара (границы слов, чтобы не задеть, например, "address").
//
// НЕ исключается: кроссовки, худи, куртки, футболки, джинсы, брюки, топы,
// кардиганы, пальто, сумки, аксессуары, косметика — весь унисекс-стритвир
// проходит как раньше. Сомнительные случаи, которые правило не трогает
// (ballet flats, wrap без уточнения), выносятся в отчёт вручную, а не
// удаляются молча.

const WOMENSWEAR_TITLE_RE = /\b(dress(es)?|gown(s)?|skirt(s)?|heel(s)?|pumps?)\b/i;
const WOMENSWEAR_TYPE_RE = /dress|gown|skirt|heel/i;

/**
 * Узкое правило по названию товара (в фиде — бренд + модель).
 * Возвращает true только для явно женских категорий: платья, юбки,
 * вечерние наряды (gown), туфли на каблуке (heels/pumps).
 */
export function isWomenswearTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  return WOMENSWEAR_TITLE_RE.test(title);
}

/**
 * Узкое правило уровня инжеста: product_type каталога Shopify и/или
 * название товара из products.json. Кроссовки, худи, куртки, футболки
 * и прочий унисекс-стритвир не затрагиваются.
 */
export function isWomenswearProduct(
  productType: string | null | undefined,
  title: string | null | undefined
): boolean {
  if (productType && WOMENSWEAR_TYPE_RE.test(productType)) return true;
  return isWomenswearTitle(title);
}
