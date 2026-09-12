const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * 404 handler - reached only if no route matched.
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Central error handler. Every thrown/forwarded error ends up here.
 * - Known ApiError instances -> returned as-is with their status code.
 * - Mongoose validation errors -> mapped to 400 with field-level messages.
 * - Mongoose duplicate key errors -> mapped to 409.
 * - Mongoose CastError (bad ObjectId) -> mapped to 400.
 * - Anything else -> logged fully, client gets a generic 500.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate value';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${message}\n${err.stack}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
