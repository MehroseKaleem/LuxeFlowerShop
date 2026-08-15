const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/tokens');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('You are not logged in. Please log in to continue.');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired session. Please log in again.');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account no longer exists or is deactivated.');
  }

  req.user = user;
  next();
});

/**
 * Same as `protect` but does not fail if there is no/invalid token — used on
 * storefront routes (e.g. cart, coupon apply) that behave differently for
 * guests vs logged-in users without requiring authentication.
 */
const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (err) {
    // ignore invalid/expired token for optional auth
  }

  next();
});

const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action.');
    }
    next();
  };

module.exports = { protect, attachUserIfPresent, restrictTo };
