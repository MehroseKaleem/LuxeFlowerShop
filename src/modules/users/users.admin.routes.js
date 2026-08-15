const express = require('express');
const controller = require('./users.admin.controller');
const rules = require('./users.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.listUsers);
router.get('/:id', rules.idParamRule, validate, controller.getUser);
router.patch('/:id/status', rules.setActiveRules, validate, controller.setActive);
router.patch('/:id/role', restrictTo('SUPER_ADMIN'), rules.setRoleRules, validate, controller.setRole);

module.exports = router;
