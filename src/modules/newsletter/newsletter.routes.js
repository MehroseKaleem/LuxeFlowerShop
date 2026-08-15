const express = require('express');
const { body } = require('express-validator');
const controller = require('./newsletter.controller');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

const emailRule = [body('email').trim().isEmail().withMessage('A valid email is required')];

router.post('/subscribe', emailRule, validate, controller.subscribe);
router.post('/unsubscribe', emailRule, validate, controller.unsubscribe);

module.exports = router;
