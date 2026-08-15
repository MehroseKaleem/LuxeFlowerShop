const express = require('express');
const controller = require('./products.controller');
const rules = require('./products.validation');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

router.get('/', controller.list);
router.get('/featured', controller.featured);
router.get('/:slug', rules.slugParamRule, validate, controller.getBySlug);
router.get('/:slug/related', rules.slugParamRule, validate, controller.related);

module.exports = router;
