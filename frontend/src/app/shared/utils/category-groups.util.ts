import { Category } from '../../models/category.model';

/**
 * Well-known slug for the "Recipient-Based" parent category (For Her, For
 * Him, For Mother, For Father, For Teachers, For Students live under it) -
 * a separate main category group from the regular Shop categories.
 */
export const RECIPIENT_BASED_SLUG = 'recipient-based';

/**
 * Reorders a flat category list so every regular Shop category comes
 * before any Recipient-Based category (its parent or any of its
 * children), each group keeping its original relative order. Used
 * anywhere both groups are listed together - Our Collections, the
 * per-category home sliders, and the admin product form - so Shop
 * categories always show first.
 */
export function sortShopFirst(categories: Category[]): Category[] {
  const recipientParent = categories.find(c => c.slug === RECIPIENT_BASED_SLUG);
  const isRecipient = (c: Category) =>
    !!recipientParent && (c.id === recipientParent.id || c.parentId === recipientParent.id);

  return [...categories.filter(c => !isRecipient(c)), ...categories.filter(isRecipient)];
}
