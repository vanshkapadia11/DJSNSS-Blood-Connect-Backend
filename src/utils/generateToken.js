const jwt = require('jsonwebtoken');

/**
 * Signs a JWT embedding the user's id and role.
 * The role claim is what the `authorize()` middleware checks against,
 * so a single token / single auth flow works for volunteers, orgs and admins.
 */
const generateToken = ({ id, role }) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
