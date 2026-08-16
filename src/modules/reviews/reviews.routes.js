const express = require('express');
const controller = require('./reviews.controller');
const rules = require('./reviews.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/featured', controller.featured);
router.get('/product/:slug', rules.slugParamRule, validate, controller.listForProduct);
router.post('/', protect, rules.createRules, validate, controller.create);
router.patch('/:id', protect, rules.updateRules, validate, controller.updateOwn);
router.delete('/:id', protect, rules.idParamRule, validate, controller.deleteOwn);

module.exports = router;
