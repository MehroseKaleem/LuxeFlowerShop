const { body, param } = require('express-validator');

const idParamRule = [param('id').isInt().withMessage('Invalid id')];

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('A valid phone number is required'),
  body('subject').optional().trim().isLength({ max: 200 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 }),
];

const replyRules = [
  param('id').isInt().withMessage('Invalid id'),
  body('message').trim().notEmpty().withMessage('Reply message is required').isLength({ max: 5000 }),
];

module.exports = { idParamRule, createRules, replyRules };
