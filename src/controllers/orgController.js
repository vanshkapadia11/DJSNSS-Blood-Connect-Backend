const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');

// @route  POST /api/v1/events
// @access Private (org)
const createEvent = asyncHandler(async (req, res) => {
  const { name, description, location, urgency, requirements_count, start_date, duration_days } = req.body;

  const event = await Event.create({
    org: req.user._id,
    name,
    description,
    location,
    urgency,
    requirements_count,
    start_date,
    duration_days,
  });

  return new ApiResponse(201, 'Event created successfully', event).send(res);
});

// helper: ensures the event exists and belongs to the requesting org
const getOwnedEventOr404 = async (eventId, orgId) => {
  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found');
  if (event.org.toString() !== orgId.toString()) {
    throw ApiError.forbidden('You do not have permission to manage this event');
  }
  return event;
};

// @route  PUT /api/v1/events/:eventId
// @access Private (org - owner only)
const updateEvent = asyncHandler(async (req, res) => {
  const event = await getOwnedEventOr404(req.params.eventId, req.user._id);

  const allowedFields = [
    'name',
    'description',
    'location',
    'urgency',
    'requirements_count',
    'start_date',
    'duration_days',
    'status',
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) event[field] = req.body[field];
  });

  await event.save(); // triggers pre-save expiry_date recalculation
  return new ApiResponse(200, 'Event updated successfully', event).send(res);
});

// @route  DELETE /api/v1/events/:eventId
// @access Private (org - owner only)
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await getOwnedEventOr404(req.params.eventId, req.user._id);
  await EventParticipation.deleteMany({ event: event._id });
  await event.deleteOne();
  return new ApiResponse(200, 'Event deleted successfully').send(res);
});

// @route  GET /api/v1/events/:eventId/volunteers
// @access Private (org - owner only)
const getEventVolunteers = asyncHandler(async (req, res) => {
  await getOwnedEventOr404(req.params.eventId, req.user._id);

  const participations = await EventParticipation.find({ event: req.params.eventId })
    .populate('volunteer', 'name email phone_no blood_group age college address health_conditions')
    .sort({ createdAt: 1 });

  return new ApiResponse(200, 'Enrolled volunteers fetched', participations).send(res);
});

// @route  POST /api/v1/events/:eventId/participants
// @access Private (org - owner only)
// body: { volunteer_ids: [...], status? } - status defaults to 'Participated'
// Marks attendance for the given volunteers (bulk update).
const markParticipants = asyncHandler(async (req, res) => {
  const event = await getOwnedEventOr404(req.params.eventId, req.user._id);
  const { volunteer_ids, status = 'Participated' } = req.body;

  const updateFields = { status };
  if (status === 'Participated') updateFields.participated_at = new Date();

  const result = await EventParticipation.updateMany(
    { event: event._id, volunteer: { $in: volunteer_ids } },
    { $set: updateFields }
  );

  return new ApiResponse(200, 'Participants updated', {
    matched: result.matchedCount,
    modified: result.modifiedCount,
  }).send(res);
});

// @route  GET /api/v1/org/me/events
// @access Private (org)
const getMyEvents = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { org: req.user._id };
  const [events, total] = await Promise.all([
    Event.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  return new ApiResponse(200, 'My events fetched', events, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }).send(res);
});

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventVolunteers,
  markParticipants,
  getMyEvents,
};
