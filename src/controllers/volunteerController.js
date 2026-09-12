const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');

// @route  GET /api/v1/events
// @access Private (volunteer)
// query: page, limit, urgency, status (defaults to Active), search
const getEvents = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { status: req.query.status || 'Active' };
  if (req.query.urgency) filter.urgency = req.query.urgency;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('org', 'name type contact_number address')
      .sort({ urgency: -1, start_date: 1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  return new ApiResponse(200, 'Events fetched', events, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

// @route  GET /api/v1/events/:eventId
// @access Private (volunteer)
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId).populate(
    'org',
    'name type contact_number address'
  );
  if (!event) throw ApiError.notFound('Event not found');

  const enrolledCount = await EventParticipation.countDocuments({
    event: event._id,
    status: { $in: ['Registered', 'Participated'] },
  });

  return new ApiResponse(200, 'Event fetched', { ...event.toObject(), enrolledCount }).send(res);
});

// @route  POST /api/v1/events/:eventId/enroll
// @access Private (volunteer)
const enrollEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const volunteerId = req.user._id;

  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found');

  if (event.status !== 'Active' || event.isExpired()) {
    throw ApiError.badRequest('This event is no longer accepting volunteers');
  }

  const currentCount = await EventParticipation.countDocuments({
    event: eventId,
    status: { $in: ['Registered', 'Participated'] },
  });
  if (currentCount >= event.requirements_count) {
    throw ApiError.conflict('This event has already reached its required number of volunteers');
  }

  const existing = await EventParticipation.findOne({ event: eventId, volunteer: volunteerId });
  if (existing) {
    if (existing.status === 'Cancelled') {
      existing.status = 'Registered';
      existing.enrolled_at = new Date();
      await existing.save();
      return new ApiResponse(200, 'Re-enrolled in event successfully', existing).send(res);
    }
    throw ApiError.conflict('You are already registered for this event');
  }

  const participation = await EventParticipation.create({
    event: eventId,
    volunteer: volunteerId,
    status: 'Registered',
  });

  return new ApiResponse(201, 'Enrolled in event successfully', participation).send(res);
});

// @route  DELETE /api/v1/events/:eventId/enroll
// @access Private (volunteer) - allows a volunteer to cancel their own registration
const cancelEnrollment = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const participation = await EventParticipation.findOne({
    event: eventId,
    volunteer: req.user._id,
  });
  if (!participation) throw ApiError.notFound('You are not registered for this event');
  if (participation.status === 'Participated') {
    throw ApiError.badRequest('Cannot cancel a registration already marked as participated');
  }

  participation.status = 'Cancelled';
  await participation.save();

  return new ApiResponse(200, 'Enrollment cancelled', participation).send(res);
});

// @route  GET /api/v1/volunteer/me/events
// @access Private (volunteer)
const getMyEvents = asyncHandler(async (req, res) => {
  const participations = await EventParticipation.find({ volunteer: req.user._id })
    .populate({
      path: 'event',
      populate: { path: 'org', select: 'name type contact_number' },
    })
    .sort({ createdAt: -1 });

  return new ApiResponse(200, 'My events fetched', participations).send(res);
});

// @route  PUT /api/v1/volunteer/me
// @access Private (volunteer)
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone_no', 'age', 'college', 'blood_group', 'health_conditions', 'address'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const volunteer = await req.user.constructor.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return new ApiResponse(200, 'Profile updated', volunteer).send(res);
});

module.exports = {
  getEvents,
  getEventById,
  enrollEvent,
  cancelEnrollment,
  getMyEvents,
  updateProfile,
};
