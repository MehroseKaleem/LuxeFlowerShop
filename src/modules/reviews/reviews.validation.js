const { body, param } = require('express-validator');

const idParamRule = [param('id').isInt().withMessage('Invalid id')];
const slugParamRule = [param('slug').notEmpty()];

const createRules = [
  body('productId').isInt().withMessage('productId is required'),
  body('orderId').optional().isInt(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ max: 150 }),
  body('comment').optional().trim().isLength({ max: 2000 }),
];

const updateRules = [
  ...idParamRule,
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('title').optional().trim().isLength({ max: 150 }),
  body('comment').optional().trim().isLength({ max: 2000 }),
];

module.exports = { idParamRule, slugParamRule, createRules, updateRules };
