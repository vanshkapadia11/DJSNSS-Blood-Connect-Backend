const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Volunteer = require('../models/Volunteer');
const Organization = require('../models/Organization');
const Admin = require('../models/Admin');

const MODEL_BY_ROLE = {
  volunteer: Volunteer,
  org: Organization,
  admin: Admin,
};

/**
 * Verifies the Bearer JWT, loads the current user (minus password) and
 * attaches it to req.user along with req.user.role for downstream checks.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Not authorized, token is invalid or expired');
  }

  const Model = MODEL_BY_ROLE[decoded.role];
  if (!Model) {
    throw ApiError.unauthorized('Not authorized, unknown role in token');
  }

  const user = await Model.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('Not authorized, user no longer exists');
  }

  if (user.isActive === false) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  req.user = user;
  req.user.role = decoded.role; // normalize role access as req.user.role
  next();
});

/**
 * Restricts a route to one or more roles, e.g. authorize('org') or
 * authorize('admin', 'org'). Must be used AFTER `protect`.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw ApiError.forbidden(
      `Role '${req.user ? req.user.role : 'unknown'}' is not allowed to access this resource`
    );
  }
  next();
};

module.exports = { protect, authorize };
