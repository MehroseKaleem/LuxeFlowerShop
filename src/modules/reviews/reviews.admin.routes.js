const express = require('express');
const controller = require('./reviews.admin.controller');
const rules = require('./reviews.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.list);
router.patch('/:id/approve', rules.idParamRule, validate, controller.approve);
router.delete('/:id', rules.idParamRule, validate, controller.remove);

module.exports = router;
