const settingsService = require('../modules/settings/settings.service');

/**
 * Reads the admin-configured store-wide sale (Settings: SITEWIDE_DISCOUNT_*)
 * and returns it only while it's actually usable - type NONE, a zero/missing
 * value, or an expiry date already in the past all mean "no sale right now",
 * so every call site can just check for a null return instead of re-deriving
 * this logic itself.
 */
async function getActiveDiscount() {
  const [type, value, expiresAt] = await Promise.all([
    settingsService.getValue('SITEWIDE_DISCOUNT_TYPE'),
    settingsService.getNumber('SITEWIDE_DISCOUNT_VALUE'),
    settingsService.getValue('SITEWIDE_DISCOUNT_EXPIRES_AT'),
  ]);

  if (!type || type === 'NONE' || !value) return null;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return null;

  return { type, value };
}

/** What a product would cost under the sale alone, from its basePrice. */
function priceUnderDiscount(basePrice, discount) {
  const base = Number(basePrice);
  const raw = discount.type === 'PERCENTAGE' ? base - (base * discount.value) / 100 : base - discount.value;
  // A steep fixed-amount discount shouldn't be able to make a cheap item
  // free or negative - floor it at a token amount instead.
  return Math.max(Math.round(raw * 100) / 100, 1);
}

/**
 * Applied on top of whatever a product already effectively sells for - a
 * store-wide sale is a floor on top of the catalog, not a replacement for a
 * better existing per-product discount, so whichever price is actually
 * cheaper for the customer wins.
 */
function applyToProduct(product, discount) {
  if (!discount || !product || product.basePrice == null) return product;

  const currentEffective =
    product.discountPrice !== null && product.discountPrice !== undefined
      ? Number(product.discountPrice)
      : Number(product.basePrice);

  const salePrice = priceUnderDiscount(product.basePrice, discount);
  const effective = Math.min(currentEffective, salePrice);

  // Only worth surfacing as a "discount" if it actually undercuts basePrice.
  if (effective >= Number(product.basePrice)) return product;

  return { ...product, discountPrice: effective.toFixed(2) };
}

function applyToList(products, discount) {
  if (!discount) return products;
  return products.map((p) => applyToProduct(p, discount));
}

module.exports = { getActiveDiscount, applyToProduct, applyToList, priceUnderDiscount };
