const { body, param } = require('express-validator');

const addItemRules = [
  body('productId').isInt().withMessage('productId is required'),
  body('variantId').optional({ nullable: true }).isInt(),
  body('quantity').optional().isInt({ min: 1 }).withMessage('quantity must be at least 1'),
];

const updateItemRules = [
  param('itemId').isInt().withMessage('Invalid cart item'),
  body('quantity').isInt({ min: 0 }).withMessage('quantity must be zero or more'),
];

const itemParamRule = [param('itemId').isInt().withMessage('Invalid cart item')];

const applyCouponRules = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('email').optional().isEmail().withMessage('A valid email is required'),
  body('phone')
    .optional()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('A valid phone number is required'),
];

const mergeCartRules = [body('sessionId').trim().notEmpty().withMessage('sessionId is required')];

module.exports = { addItemRules, updateItemRules, itemParamRule, applyCouponRules, mergeCartRules };
