const express = require('express');
const { body } = require('express-validator');
const controller = require('./settings.admin.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.getSettings);
router.patch('/', body().isObject().withMessage('Request body must be an object of settings'), validate, controller.updateSettings);

module.exports = router;
