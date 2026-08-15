const { body, param } = require('express-validator');

const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 1, max: 120 }),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('A valid phone number is required'),
];

const addressRules = [
  body('label').optional().trim().isLength({ max: 50 }),
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 120 }),
  body('phone')
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('A valid phone number is required'),
  body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('addressLine2').optional().trim(),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('emirate').trim().notEmpty().withMessage('Emirate is required'),
  body('postalCode').optional().trim(),
  body('isDefault').optional().isBoolean().toBoolean(),
];

// Independent chain instances (not derived from addressRules) so making
// these optional for updates can never mutate the required create-address rules.
const addressUpdateRules = [
  param('id').isInt().withMessage('Invalid address id'),
  body('label').optional().trim().isLength({ max: 50 }),
  body('fullName').optional().trim().isLength({ min: 1, max: 120 }),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('A valid phone number is required'),
  body('addressLine1').optional().trim().notEmpty(),
  body('addressLine2').optional().trim(),
  body('city').optional().trim().notEmpty(),
  body('emirate').optional().trim().notEmpty(),
  body('postalCode').optional().trim(),
  body('isDefault').optional().isBoolean().toBoolean(),
];

const idParamRule = [param('id').isInt().withMessage('Invalid id')];

const setActiveRules = [...idParamRule, body('isActive').isBoolean().withMessage('isActive must be boolean').toBoolean()];

const setRoleRules = [
  ...idParamRule,
  body('role').isIn(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']).withMessage('Invalid role'),
];

module.exports = {
  updateProfileRules,
  addressRules,
  addressUpdateRules,
  idParamRule,
  setActiveRules,
  setRoleRules,
};
