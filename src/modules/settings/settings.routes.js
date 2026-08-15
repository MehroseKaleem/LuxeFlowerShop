const express = require('express');
const controller = require('./settings.controller');

const router = express.Router();

router.get('/', controller.getPublicSettings);

module.exports = router;
