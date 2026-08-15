const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const categoriesRoutes = require('../modules/categories/categories.routes');
const productsRoutes = require('../modules/products/products.routes');
const cartRoutes = require('../modules/cart/cart.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const paymentsRoutes = require('../modules/payments/payments.routes');
const reviewsRoutes = require('../modules/reviews/reviews.routes');
const wishlistRoutes = require('../modules/wishlist/wishlist.routes');
const bannersRoutes = require('../modules/banners/banners.routes');
const settingsRoutes = require('../modules/settings/settings.routes');
const newsletterRoutes = require('../modules/newsletter/newsletter.routes');
const contactRoutes = require('../modules/contact/contact.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/banners', bannersRoutes);
router.use('/settings', settingsRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/contact', contactRoutes);

module.exports = router;
