const express = require('express');
const controller = require('./auth.controller');
const rules = require('./auth.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, rules.registerRules, validate, controller.register);
router.post('/login', authLimiter, rules.loginRules, validate, controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/logout-all', protect, controller.logoutAll);
router.get('/me', protect, controller.me);

router.post(
  '/forgot-password',
  authLimiter,
  rules.forgotPasswordRules,
  validate,
  controller.forgotPassword,
);
router.post('/reset-password/:token', rules.resetPasswordRules, validate, controller.resetPassword);
router.get('/verify-email/:token', controller.verifyEmail);
router.post('/resend-verification', protect, controller.resendVerification);
router.post('/change-password', protect, rules.changePasswordRules, validate, controller.changePassword);

module.exports = router;
