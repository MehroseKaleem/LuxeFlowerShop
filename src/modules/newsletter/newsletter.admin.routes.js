const express = require('express');
const controller = require('./newsletter.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));
router.get('/', controller.adminList);

module.exports = router;
