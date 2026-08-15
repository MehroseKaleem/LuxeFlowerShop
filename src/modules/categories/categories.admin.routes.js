const express = require('express');
const controller = require('./categories.admin.controller');
const rules = require('./categories.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const { categoryUpload } = require('../../config/multer');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.list);
router.get('/:id', rules.idParamRule, validate, controller.get);
router.post(
  '/',
  upload.single(categoryUpload, 'image'),
  rules.createRules,
  validate,
  controller.create,
);
router.patch(
  '/:id',
  upload.single(categoryUpload, 'image'),
  rules.updateRules,
  validate,
  controller.update,
);
router.delete('/:id', rules.idParamRule, validate, controller.remove);

module.exports = router;
