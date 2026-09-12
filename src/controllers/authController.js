const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const generateToken = require('../utils/generateToken');
const Volunteer = require('../models/Volunteer');
const Organization = require('../models/Organization');
const Admin = require('../models/Admin');

const MODEL_BY_ROLE = {
  volunteer: Volunteer,
  org: Organization,
  admin: Admin,
};

// sanitize a mongoose doc for the response (drop __v, password is already select:false)
const toSafeObject = (doc) => {
  const obj = doc.toObject();
  delete obj.__v;
  return obj;
};

// @route  POST /api/v1/auth/volunteer/register
// @access Public
const registerVolunteer = asyncHandler(async (req, res) => {
  const { name, email, password, phone_no, age, college, blood_group, health_conditions, address } = req.body;

  const existing = await Volunteer.findOne({ email });
  if (existing) throw ApiError.conflict('A volunteer with this email already exists');

  const volunteer = await Volunteer.create({
    name,
    email,
    password,
    phone_no,
    age,
    college,
    blood_group,
    health_conditions,
    address,
  });

  const token = generateToken({ id: volunteer._id, role: 'volunteer' });

  return new ApiResponse(201, 'Volunteer registered successfully', {
    user: toSafeObject(volunteer),
    token,
  }).send(res);
});

// @route  POST /api/v1/auth/org/register
// @access Public
const registerOrg = asyncHandler(async (req, res) => {
  const { name, type, address, contact_number, email, password } = req.body;

  const existing = await Organization.findOne({ email });
  if (existing) throw ApiError.conflict('An organization with this email already exists');

  const org = await Organization.create({ name, type, address, contact_number, email, password });

  const token = generateToken({ id: org._id, role: 'org' });

  return new ApiResponse(201, 'Organization registered successfully', {
    user: toSafeObject(org),
    token,
  }).send(res);
});

// @route  POST /api/v1/auth/login
// @access Public
// body: { email, password, role }  role in ['volunteer', 'org', 'admin']
const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const Model = MODEL_BY_ROLE[role];
  if (!Model) throw ApiError.badRequest('Invalid role');

  const user = await Model.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  if (user.isActive === false) throw ApiError.forbidden('This account has been deactivated');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  const token = generateToken({ id: user._id, role });
  user.password = undefined;

  return new ApiResponse(200, 'Login successful', {
    user: toSafeObject(user),
    token,
  }).send(res);
});

// @route  GET /api/v1/auth/me
// @access Private (any authenticated role)
const getMe = asyncHandler(async (req, res) => {
  return new ApiResponse(200, 'Current user fetched', {
    user: toSafeObject(req.user),
    role: req.user.role,
  }).send(res);
});

module.exports = { registerVolunteer, registerOrg, login, getMe };
