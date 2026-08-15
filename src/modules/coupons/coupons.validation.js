const { body, param } = require('express-validator');

const idParamRule = [param('id').isInt().withMessage('Invalid id')];

const createRules = [
  body('code').trim().notEmpty().withMessage('Coupon code is required').isLength({ max: 50 }),
  body('description').optional().trim().isLength({ max: 255 }),
  body('discountType').isIn(['PERCENTAGE', 'FIXED']).withMessage('discountType must be PERCENTAGE or FIXED'),
  body('discountValue').isFloat({ gt: 0 }).withMessage('discountValue must be greater than 0'),
  body('minOrderAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('maxDiscountAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('usageLimit').optional({ nullable: true }).isInt({ min: 1 }),
  body('usageLimitPerUser').optional().isInt({ min: 1 }).withMessage('usageLimitPerUser must be at least 1'),
  body('startsAt').optional({ nullable: true }).isISO8601().withMessage('startsAt must be a valid date').toDate(),
  body('expiresAt')
    .notEmpty()
    .withMessage('expiresAt is required')
    .isISO8601()
    .withMessage('expiresAt must be a valid date')
    .toDate()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('expiresAt must be a future date');
      }
      return true;
    }),
  body('isActive').optional().isBoolean().toBoolean(),
];

const updateRules = [
  ...idParamRule,
  body('code').optional().trim().isLength({ min: 1, max: 50 }),
  body('description').optional().trim().isLength({ max: 255 }),
  body('discountType').optional().isIn(['PERCENTAGE', 'FIXED']),
  body('discountValue').optional().isFloat({ gt: 0 }),
  body('minOrderAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('maxDiscountAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('usageLimit').optional({ nullable: true }).isInt({ min: 1 }),
  body('usageLimitPerUser').optional().isInt({ min: 1 }),
  body('startsAt').optional({ nullable: true }).isISO8601().toDate(),
  body('expiresAt').optional().isISO8601().withMessage('expiresAt must be a valid date').toDate(),
  body('isActive').optional().isBoolean().toBoolean(),
];

module.exports = { idParamRule, createRules, updateRules };
