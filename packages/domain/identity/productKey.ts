// packages/domain/identity/productKey.ts
//
// Spec §15 "Deduplication" EXACTLY:
//   product key = brand + normalized_model + exact_identifier + variant
//   offer key   = product_variant_id + seller_id + seller_sku + region
//   "Не объединять разные размеры, память, цвет или seller-of-record."

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface ProductKeyInput {
  brand: string;
  model: string;
  exactIdentifier: string; // SKU / reference / UPC / DPCI
  variant: string; // size/color/configuration — never blank for variant-bearing products
}

export function buildProductKey(input: ProductKeyInput): string {
  return [
    normalize(input.brand),
    normalize(input.model),
    normalize(input.exactIdentifier),
    normalize(input.variant),
  ].join("|");
}

export interface OfferKeyInput {
  productVariantId: string;
  sellerId: string;
  sellerSku: string;
  region: string;
}

export function buildOfferKey(input: OfferKeyInput): string {
  return [
    input.productVariantId,
    input.sellerId,
    normalize(input.sellerSku),
    normalize(input.region),
  ].join("|");
}

/**
 * Explicit guard used by the identity resolver: two candidates with the same
 * brand/model/identifier but DIFFERENT variant must never merge.
 */
export function isSameProduct(a: ProductKeyInput, b: ProductKeyInput): boolean {
  return buildProductKey(a) === buildProductKey(b);
}
