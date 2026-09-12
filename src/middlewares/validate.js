const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after an array of express-validator checks. If any failed,
 * short-circuits with a 400 ApiError containing all field messages.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
    return next(ApiError.badRequest('Validation failed', messages));
  }
  next();
};

module.exports = validate;
