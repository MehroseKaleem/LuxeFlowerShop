const express = require('express');
const controller = require('./orders.controller');
const rules = require('./orders.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, attachUserIfPresent } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/', attachUserIfPresent, rules.createOrderRules, validate, controller.createOrder);
router.get('/', protect, controller.getMyOrders);
router.get('/:orderNumber', protect, rules.orderNumberParamRule, validate, controller.getMyOrderByNumber);

module.exports = router;
