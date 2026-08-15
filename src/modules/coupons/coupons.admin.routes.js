const express = require('express');
const controller = require('./coupons.admin.controller');
const rules = require('./coupons.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.list);
router.get('/:id', rules.idParamRule, validate, controller.get);
router.post('/', rules.createRules, validate, controller.create);
router.patch('/:id', rules.updateRules, validate, controller.update);
router.patch('/:id/toggle', rules.idParamRule, validate, controller.toggleActive);
router.delete('/:id', rules.idParamRule, validate, controller.remove);

module.exports = router;
