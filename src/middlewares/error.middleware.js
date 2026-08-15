const multer = require('multer');
const { Prisma } = require('@prisma/client');
const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

function mapPrismaError(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // On MySQL/MariaDB, Prisma's `meta.target` is the constraint/index
        // name (a string) rather than an array of column names like on
        // Postgres — handle both shapes instead of assuming .join() exists.
        const rawTarget = err.meta && err.meta.target;
        const fieldLabel = Array.isArray(rawTarget) ? rawTarget.join(', ') : rawTarget;
        return ApiError.conflict(`A record with this ${fieldLabel || 'value'} already exists.`);
      }
      case 'P2025':
        return ApiError.notFound('The requested resource was not found.');
      case 'P2003':
        return ApiError.badRequest('This action references a record that does not exist.');
      default:
        return ApiError.badRequest('Invalid request.');
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest('Invalid request data.');
  }
  return null;
}

function mapKnownError(err) {
  if (err instanceof ApiError) return err;

  const prismaError = mapPrismaError(err);
  if (prismaError) return prismaError;

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiError.badRequest(`File too large. Max size is ${env.upload.maxFileSizeMb}MB.`);
    }
    return ApiError.badRequest(err.message || 'File upload error.');
  }

  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid token.');
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Token has expired.');

  // express.json()'s body-parser throws a plain SyntaxError with this type
  // for malformed request bodies — it's a client mistake, not a server
  // failure, and must not be logged/reported as one.
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    return ApiError.badRequest('Malformed JSON in request body.');
  }

  if (err.type === 'StripeCardError' || (err.type && err.type.startsWith('Stripe'))) {
    return ApiError.badRequest(err.message || 'Payment processing error.');
  }

  return null;
}

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const mapped = mapKnownError(err) || ApiError.internal('Something went wrong. Please try again.');

  if (mapped.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${mapped.message}`);
  }

  const response = {
    success: false,
    statusCode: mapped.statusCode,
    message: mapped.message,
  };

  if (mapped.details) response.details = mapped.details;
  if (!env.isProd && mapped.statusCode >= 500) response.stack = err.stack;

  res.status(mapped.statusCode).json(response);
}

module.exports = errorMiddleware;
