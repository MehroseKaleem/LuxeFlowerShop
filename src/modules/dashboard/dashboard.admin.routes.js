const express = require('express');
const controller = require('./dashboard.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/overview', controller.getOverview);
router.get('/sales', controller.getSalesOverTime);
router.get('/top-products', controller.getTopProducts);
router.get('/low-stock', controller.getLowStockProducts);
router.get('/order-status-breakdown', controller.getOrderStatusBreakdown);

module.exports = router;
