/**
 * Wraps a multer single/array middleware so upload errors (file too large,
 * bad mime type, etc.) flow into the centralized error handler instead of
 * crashing the request unhandled.
 */
const single = (uploader, fieldName) => (req, res, next) => {
  uploader.single(fieldName)(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

const array = (uploader, fieldName, maxCount) => (req, res, next) => {
  uploader.array(fieldName, maxCount)(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

module.exports = { single, array };
