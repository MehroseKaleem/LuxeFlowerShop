const express = require('express');
const controller = require('./cart.admin.controller');
const rules = require('./cart.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.list);
router.delete('/:id', rules.adminIdParamRule, validate, controller.remove);

module.exports = router;
