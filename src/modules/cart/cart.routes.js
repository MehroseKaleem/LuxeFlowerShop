const express = require('express');
const controller = require('./cart.controller');
const rules = require('./cart.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, attachUserIfPresent } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(attachUserIfPresent);

router.get('/', controller.getCart);
router.post('/items', rules.addItemRules, validate, controller.addItem);
router.patch('/items/:itemId', rules.updateItemRules, validate, controller.updateItem);
router.delete('/items/:itemId', rules.itemParamRule, validate, controller.removeItem);
router.delete('/', controller.clearCart);

router.post('/coupon', rules.applyCouponRules, validate, controller.applyCoupon);
router.delete('/coupon', controller.removeCoupon);

router.post('/merge', protect, rules.mergeCartRules, validate, controller.mergeGuestCart);

module.exports = router;
