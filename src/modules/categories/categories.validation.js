const { body, param } = require('express-validator');

const idParamRule = [param('id').isInt().withMessage('Invalid id')];
const slugParamRule = [param('slug').notEmpty()];

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('description').optional().trim(),
  body('parentId').optional().isInt().withMessage('Invalid parent category').toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt().toInt(),
];

const updateRules = [
  ...idParamRule,
  body('name').optional().trim().isLength({ min: 1, max: 150 }),
  body('description').optional().trim(),
  body('parentId').optional().isInt().withMessage('Invalid parent category').toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt().toInt(),
];

module.exports = { idParamRule, slugParamRule, createRules, updateRules };
