const express = require('express');

const usersAdminRoutes = require('../modules/users/users.admin.routes');
const categoriesAdminRoutes = require('../modules/categories/categories.admin.routes');
const productsAdminRoutes = require('../modules/products/products.admin.routes');
const couponsAdminRoutes = require('../modules/coupons/coupons.admin.routes');
const ordersAdminRoutes = require('../modules/orders/orders.admin.routes');
const reviewsAdminRoutes = require('../modules/reviews/reviews.admin.routes');
const bannersAdminRoutes = require('../modules/banners/banners.admin.routes');
const settingsAdminRoutes = require('../modules/settings/settings.admin.routes');
const newsletterAdminRoutes = require('../modules/newsletter/newsletter.admin.routes');
const contactAdminRoutes = require('../modules/contact/contact.admin.routes');
const dashboardAdminRoutes = require('../modules/dashboard/dashboard.admin.routes');
const cartsAdminRoutes = require('../modules/cart/cart.admin.routes');
const { adminLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.use(adminLimiter);

router.use('/users', usersAdminRoutes);
router.use('/categories', categoriesAdminRoutes);
router.use('/products', productsAdminRoutes);
router.use('/coupons', couponsAdminRoutes);
router.use('/orders', ordersAdminRoutes);
router.use('/reviews', reviewsAdminRoutes);
router.use('/banners', bannersAdminRoutes);
router.use('/settings', settingsAdminRoutes);
router.use('/newsletter', newsletterAdminRoutes);
router.use('/contact', contactAdminRoutes);
router.use('/dashboard', dashboardAdminRoutes);
router.use('/carts', cartsAdminRoutes);

module.exports = router;
