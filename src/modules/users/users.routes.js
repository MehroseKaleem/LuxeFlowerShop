const express = require('express');
const controller = require('./users.controller');
const rules = require('./users.validation');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { avatarUpload } = require('../../config/multer');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);

router.patch('/me', rules.updateProfileRules, validate, controller.updateProfile);
router.post('/me/avatar', upload.single(avatarUpload, 'avatar'), controller.uploadAvatar);

router.get('/me/addresses', controller.listAddresses);
router.post('/me/addresses', rules.addressRules, validate, controller.createAddress);
router.patch('/me/addresses/:id', rules.addressUpdateRules, validate, controller.updateAddress);
router.delete('/me/addresses/:id', rules.idParamRule, validate, controller.deleteAddress);
router.patch('/me/addresses/:id/default', rules.idParamRule, validate, controller.setDefaultAddress);

module.exports = router;
