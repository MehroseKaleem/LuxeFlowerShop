const { body, param } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone')
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('A valid phone number is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [body('email').trim().isEmail().withMessage('A valid email is required')];

const resetPasswordRules = [
  param('token').notEmpty(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
];

module.exports = {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
};
