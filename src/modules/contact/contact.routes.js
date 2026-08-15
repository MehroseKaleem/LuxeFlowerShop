const express = require('express');
const controller = require('./contact.controller');
const rules = require('./contact.validation');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

router.post('/', rules.createRules, validate, controller.create);

module.exports = router;
