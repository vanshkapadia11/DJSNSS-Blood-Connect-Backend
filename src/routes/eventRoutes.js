const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');
const { enrollLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');

const {
  createEventValidator,
  updateEventValidator,
  eventIdParamValidator,
  markParticipantsValidator,
} = require('../validators/eventValidators');

const {
  getEvents,
  getEventById,
  enrollEvent,
  cancelEnrollment,
} = require('../controllers/volunteerController');

const {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventVolunteers,
  markParticipants,
} = require('../controllers/orgController');

// All routes below require authentication; role is checked per-route.
router.use(protect);

// ---- Volunteer-facing ----
router.get('/', authorize('volunteer'), getEvents);
router.get('/:eventId', authorize('volunteer'), eventIdParamValidator, validate, getEventById);
router.post(
  '/:eventId/enroll',
  authorize('volunteer'),
  enrollLimiter,
  eventIdParamValidator,
  validate,
  enrollEvent
);
router.delete('/:eventId/enroll', authorize('volunteer'), eventIdParamValidator, validate, cancelEnrollment);

// ---- Organization-facing ----
router.post('/', authorize('org'), createEventValidator, validate, createEvent);
router.put('/:eventId', authorize('org'), updateEventValidator, validate, updateEvent);
router.delete('/:eventId', authorize('org'), eventIdParamValidator, validate, deleteEvent);
router.get(
  '/:eventId/volunteers',
  authorize('org'),
  eventIdParamValidator,
  validate,
  getEventVolunteers
);
router.post(
  '/:eventId/participants',
  authorize('org'),
  markParticipantsValidator,
  validate,
  markParticipants
);

module.exports = router;
