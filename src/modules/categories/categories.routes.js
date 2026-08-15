const express = require('express');
const controller = require('./categories.controller');
const rules = require('./categories.validation');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

router.get('/', controller.list);
router.get('/:slug', rules.slugParamRule, validate, controller.getBySlug);

module.exports = router;
