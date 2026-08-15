const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('./env');

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(null, true);
  }
  cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPG, PNG, WEBP or AVIF images are allowed'));
};

const makeStorage = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(uploadsRoot, subfolder));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      cb(null, uniqueName);
    },
  });

const makeUploader = (subfolder, maxFiles = 1) =>
  multer({
    storage: makeStorage(subfolder),
    fileFilter,
    limits: {
      fileSize: env.upload.maxFileSizeMb * 1024 * 1024,
      files: maxFiles,
    },
  });

module.exports = {
  uploadsRoot,
  productUpload: makeUploader('products', 10),
  categoryUpload: makeUploader('categories', 1),
  bannerUpload: makeUploader('banners', 1),
  avatarUpload: makeUploader('avatars', 1),
};
