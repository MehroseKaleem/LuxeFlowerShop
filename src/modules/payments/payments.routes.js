const express = require('express');
const controller = require('./payments.controller');
const rules = require('./payments.validation');
const validate = require('../../middlewares/validate.middleware');
const { attachUserIfPresent } = require('../../middlewares/auth.middleware');

const router = express.Router();

// NOTE: the Stripe webhook route is intentionally NOT here — it needs the
// raw request body (for signature verification) and is wired up directly
// in app.js, before the global JSON body parser runs.
router.post('/create-intent', attachUserIfPresent, rules.createIntentRules, validate, controller.createIntent);

module.exports = router;
