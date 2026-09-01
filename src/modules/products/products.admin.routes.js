const express = require('express');
const controller = require('./products.admin.controller');
const rules = require('./products.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const { productUpload } = require('../../config/multer');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.list);
router.get('/:id', rules.idParamRule, validate, controller.get);
router.post('/', upload.array(productUpload, 'images', 10), rules.createRules, validate, controller.create);
router.patch('/:id', rules.updateRules, validate, controller.update);
router.delete('/:id', rules.idParamRule, validate, controller.remove);

router.post('/:id/images', rules.idParamRule, validate, upload.array(productUpload, 'images', 10), controller.addImages);
router.delete('/:id/images/:imageId', rules.idParamRule, validate, controller.removeImage);
router.patch('/:id/images/:imageId/primary', rules.idParamRule, validate, controller.setPrimaryImage);

router.post('/:id/variants', rules.idParamRule, rules.variantRules, validate, controller.addVariant);
router.patch(
  '/:id/variants/:variantId',
  rules.idParamRule,
  rules.variantUpdateRules,
  validate,
  controller.updateVariant,
);
router.delete('/:id/variants/:variantId', rules.idParamRule, validate, controller.deleteVariant);

module.exports = router;
