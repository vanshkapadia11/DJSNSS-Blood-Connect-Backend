const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Volunteer = require('../models/Volunteer');
const Organization = require('../models/Organization');
const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');

const paginationParams = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// @route  GET /api/v1/admin/volunteers
const listVolunteers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(req);
  const [volunteers, total] = await Promise.all([
    Volunteer.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Volunteer.countDocuments(),
  ]);
  return new ApiResponse(200, 'Volunteers fetched', volunteers, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

// @route  GET /api/v1/admin/volunteers/:id
const getVolunteerById = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);
  if (!volunteer) throw ApiError.notFound('Volunteer not found');
  return new ApiResponse(200, 'Volunteer fetched', volunteer).send(res);
});

// @route  DELETE /api/v1/admin/volunteers/:id
// Soft-removes (deactivates) rather than hard-deleting, so historical
// EventParticipation records stay intact for reporting/audit purposes.
const removeVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);
  if (!volunteer) throw ApiError.notFound('Volunteer not found');

  volunteer.isActive = false;
  await volunteer.save();

  return new ApiResponse(200, 'Volunteer removed/deactivated successfully').send(res);
});

// @route  GET /api/v1/admin/orgs
const listOrgs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(req);
  const [orgs, total] = await Promise.all([
    Organization.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Organization.countDocuments(),
  ]);
  return new ApiResponse(200, 'Organizations fetched', orgs, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

// @route  GET /api/v1/admin/orgs/:id
const getOrgById = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw ApiError.notFound('Organization not found');
  return new ApiResponse(200, 'Organization fetched', org).send(res);
});

// @route  GET /api/v1/admin/events/:id
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('org', 'name type email');
  if (!event) throw ApiError.notFound('Event not found');
  return new ApiResponse(200, 'Event fetched', event).send(res);
});

// @route  GET /api/v1/admin/events
const listEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(req);
  const [events, total] = await Promise.all([
    Event.find().populate('org', 'name type').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Event.countDocuments(),
  ]);
  return new ApiResponse(200, 'Events fetched', events, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

// @route  DELETE /api/v1/admin/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');

  await EventParticipation.deleteMany({ event: event._id });
  await event.deleteOne();

  return new ApiResponse(200, 'Event deleted successfully by admin').send(res);
});

module.exports = {
  listVolunteers,
  getVolunteerById,
  removeVolunteer,
  listOrgs,
  getOrgById,
  listEvents,
  getEventById,
  deleteEvent,
};
