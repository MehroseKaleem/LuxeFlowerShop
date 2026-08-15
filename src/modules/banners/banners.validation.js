const { body, param } = require('express-validator');

const idParamRule = [param('id').isInt().withMessage('Invalid id')];

const createRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('link').optional().trim().isLength({ max: 500 }),
  body('position').optional().trim().isLength({ max: 50 }),
  body('sortOrder').optional().isInt().toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('startsAt').optional({ nullable: true }).isISO8601().toDate(),
  body('endsAt').optional({ nullable: true }).isISO8601().toDate(),
];

const updateRules = [
  ...idParamRule,
  body('title').optional().trim().isLength({ min: 1, max: 150 }),
  body('link').optional().trim().isLength({ max: 500 }),
  body('position').optional().trim().isLength({ max: 50 }),
  body('sortOrder').optional().isInt().toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('startsAt').optional({ nullable: true }).isISO8601().toDate(),
  body('endsAt').optional({ nullable: true }).isISO8601().toDate(),
];

module.exports = { idParamRule, createRules, updateRules };
