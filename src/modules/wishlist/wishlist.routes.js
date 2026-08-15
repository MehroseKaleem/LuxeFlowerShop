const express = require('express');
const { body, param } = require('express-validator');
const controller = require('./wishlist.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', controller.list);
router.post('/', body('productId').isInt().withMessage('productId is required'), validate, controller.add);
router.delete('/:productId', param('productId').isInt(), validate, controller.remove);

module.exports = router;
