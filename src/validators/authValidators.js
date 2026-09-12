const { body } = require('express-validator');
const { BLOOD_GROUPS } = require('../models/Volunteer');
const { ORG_TYPES } = require('../models/Organization');

const registerVolunteerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone_no').trim().notEmpty().withMessage('Phone number is required'),
  body('age').isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('blood_group').isIn(BLOOD_GROUPS).withMessage(`blood_group must be one of: ${BLOOD_GROUPS.join(', ')}`),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('college').optional().trim(),
  body('health_conditions').optional().trim(),
];

const registerOrgValidator = [
  body('name').trim().notEmpty().withMessage('Organization name is required'),
  body('type').isIn(ORG_TYPES).withMessage(`type must be one of: ${ORG_TYPES.join(', ')}`),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('contact_number').trim().notEmpty().withMessage('Contact number is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('role')
    .isIn(['volunteer', 'org', 'admin'])
    .withMessage("role must be one of: 'volunteer', 'org', 'admin'"),
];

module.exports = { registerVolunteerValidator, registerOrgValidator, loginValidator };
