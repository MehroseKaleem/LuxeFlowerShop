const { body } = require('express-validator');

const createIntentRules = [
  body('orderNumber').trim().notEmpty().withMessage('orderNumber is required'),
  body('email').optional().isEmail().withMessage('A valid email is required'),
];

module.exports = { createIntentRules };
