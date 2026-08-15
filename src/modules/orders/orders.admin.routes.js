const express = require('express');
const controller = require('./orders.admin.controller');
const rules = require('./orders.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.list);
router.get('/:id', rules.idParamRule, validate, controller.get);
router.patch('/:id/status', rules.updateStatusRules, validate, controller.updateStatus);
router.patch('/:id/payment-status', rules.updatePaymentStatusRules, validate, controller.updatePaymentStatus);

module.exports = router;
