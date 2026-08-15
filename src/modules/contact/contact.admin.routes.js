const express = require('express');
const controller = require('./contact.controller');
const rules = require('./contact.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.adminList);
router.patch('/:id/read', rules.idParamRule, validate, controller.adminMarkRead);
router.delete('/:id', rules.idParamRule, validate, controller.adminDelete);

module.exports = router;
