const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('./env');
const { cloudinary, isCloudinaryEnabled } = require('./cloudinary');

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(null, true);
  }
  cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPG, PNG, WEBP or AVIF images are allowed'));
};

/**
 * Uploads directly to Cloudinary and lets it auto-optimize (format + quality)
 * and serve from its CDN — used whenever CLOUDINARY_* env vars are set.
 */
class CloudinaryFileStorage {
  constructor(subfolder) {
    this.subfolder = subfolder;
  }

  _handleFile(req, file, cb) {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `luxeflower/${this.subfolder}`,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (err, result) => {
        if (err) return cb(err);
        cb(null, {
          url: result.secure_url,
          publicId: result.public_id,
          size: result.bytes,
        });
      },
    );
    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    if (!file.publicId) return cb(null);
    cloudinary.uploader.destroy(file.publicId, () => cb(null));
  }
}

/**
 * Local-disk fallback (used when Cloudinary isn't configured, e.g. local
 * dev) — wraps multer's own diskStorage so it exposes the same
 * `file.url` / `file.publicId` shape as CloudinaryFileStorage.
 */
class LocalDiskStorage {
  constructor(subfolder) {
    this.subfolder = subfolder;
    this.disk = multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(uploadsRoot, subfolder)),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
        cb(null, uniqueName);
      },
    });
  }

  _handleFile(req, file, cb) {
    this.disk._handleFile(req, file, (err, info) => {
      if (err) return cb(err);
      cb(null, { ...info, url: `/uploads/${this.subfolder}/${info.filename}`, publicId: null });
    });
  }

  _removeFile(req, file, cb) {
    this.disk._removeFile(req, file, cb);
  }
}

const makeUploader = (subfolder, maxFiles = 1) =>
  multer({
    storage: isCloudinaryEnabled ? new CloudinaryFileStorage(subfolder) : new LocalDiskStorage(subfolder),
    fileFilter,
    limits: {
      fileSize: env.upload.maxFileSizeMb * 1024 * 1024,
      files: maxFiles,
    },
  });

function extractCloudinaryPublicId(url) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

/** Deletes a previously-uploaded image regardless of which backend stored it. */
async function deleteUploadedImage(url) {
  if (!url) return;
  if (/^https?:\/\/res\.cloudinary\.com\//.test(url)) {
    const publicId = extractCloudinaryPublicId(url);
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // best-effort cleanup — a failed delete shouldn't fail the request
    }
    return;
  }

  try {
    await fs.promises.unlink(path.join(uploadsRoot, url.replace(/^\/?uploads\//, '')));
  } catch {
    // best-effort cleanup — a failed delete shouldn't fail the request
  }
}

module.exports = {
  uploadsRoot,
  isCloudinaryEnabled,
  deleteUploadedImage,
  productUpload: makeUploader('products', 10),
  categoryUpload: makeUploader('categories', 1),
  bannerUpload: makeUploader('banners', 1),
  avatarUpload: makeUploader('avatars', 1),
};
