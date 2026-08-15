const { body, param } = require('express-validator');

const idParamRule = [param('id').isInt().withMessage('Invalid id').toInt()];
const slugParamRule = [param('slug').notEmpty()];

// Admin submits one or more checked category checkboxes under the same
// `categoryIds` field name — a single checked box arrives as a scalar
// value, multiple as an array, so both shapes are accepted here.
const categoryIdsValidator = (optional) => {
  const chain = body('categoryIds');
  return (optional ? chain.optional() : chain.notEmpty().withMessage('At least one category is required')).custom(
    (value) => {
      if (value === undefined) return true;
      const ids = Array.isArray(value) ? value : [value];
      if (!ids.length || ids.some((id) => id === '' || id === null || Number.isNaN(Number(id)))) {
        throw new Error('categoryIds must be one or more valid category ids');
      }
      return true;
    },
  );
};

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 200 }),
  body('sku').trim().notEmpty().withMessage('SKU is required').isLength({ max: 60 }),
  categoryIdsValidator(false),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('discountPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('costPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('lowStockThreshold').optional().isInt({ min: 0 }),
  body('weightGrams').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('shortDescription').optional().trim().isLength({ max: 500 }),
  body('description').optional().trim(),
  body('metaTitle').optional().trim().isLength({ max: 200 }),
  body('metaDescription').optional().trim().isLength({ max: 300 }),
];

const updateRules = [
  ...idParamRule,
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('sku').optional().trim().isLength({ min: 1, max: 60 }),
  categoryIdsValidator(true),
  body('basePrice').optional().isFloat({ min: 0 }),
  body('discountPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('costPrice').optional({ nullable: true }).isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('lowStockThreshold').optional().isInt({ min: 0 }),
  body('weightGrams').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('shortDescription').optional().trim().isLength({ max: 500 }),
  body('description').optional().trim(),
];

const variantRules = [
  body('name').trim().notEmpty().withMessage('Variant name is required'),
  body('sku').trim().notEmpty().withMessage('Variant SKU is required'),
  body('priceAdjustment').optional().isFloat(),
  body('stock').optional().isInt({ min: 0 }),
  body('isDefault').optional().isBoolean().toBoolean(),
];

const variantUpdateRules = [
  body('name').optional().trim().notEmpty(),
  body('sku').optional().trim().notEmpty(),
  body('priceAdjustment').optional().isFloat(),
  body('stock').optional().isInt({ min: 0 }),
  body('isDefault').optional().isBoolean().toBoolean(),
  body('isActive').optional().isBoolean().toBoolean(),
];

const stockAdjustRules = [
  body('mode').isIn(['SET', 'INCREMENT', 'DECREMENT']).withMessage('mode must be SET, INCREMENT or DECREMENT'),
  body('quantity').isInt({ min: 0 }).withMessage('quantity must be a non-negative integer'),
];

module.exports = {
  idParamRule,
  slugParamRule,
  createRules,
  updateRules,
  variantRules,
  variantUpdateRules,
  stockAdjustRules,
};
