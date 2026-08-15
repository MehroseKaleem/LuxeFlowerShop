const express = require('express');
const controller = require('./banners.admin.controller');
const rules = require('./banners.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const { bannerUpload } = require('../../config/multer');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

router.use(protect, restrictTo('ADMIN', 'SUPER_ADMIN'));

router.get('/', controller.list);
router.post('/', upload.single(bannerUpload, 'image'), rules.createRules, validate, controller.create);
router.patch('/:id', upload.single(bannerUpload, 'image'), rules.updateRules, validate, controller.update);
router.delete('/:id', rules.idParamRule, validate, controller.remove);

module.exports = router;
