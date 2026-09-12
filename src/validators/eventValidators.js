const { body, param } = require('express-validator');
const { URGENCY_LEVELS } = require('../models/Event');
const { PARTICIPATION_STATUS } = require('../models/EventParticipation');

const mongoIdParam = (name) =>
  param(name).isMongoId().withMessage(`${name} must be a valid Mongo ObjectId`);

const createEventValidator = [
  body('name').trim().notEmpty().withMessage('Event name is required'),
  body('urgency').optional().isIn(URGENCY_LEVELS).withMessage(`urgency must be one of: ${URGENCY_LEVELS.join(', ')}`),
  body('requirements_count').isInt({ min: 1 }).withMessage('requirements_count must be a positive integer'),
  body('start_date').isISO8601().toDate().withMessage('start_date must be a valid date'),
  body('duration_days').isInt({ min: 1 }).withMessage('duration_days must be a positive integer'),
  body('description').optional().trim(),
  body('location').optional().trim(),
];

const updateEventValidator = [
  mongoIdParam('eventId'),
  body('name').optional().trim().notEmpty(),
  body('urgency').optional().isIn(URGENCY_LEVELS),
  body('requirements_count').optional().isInt({ min: 1 }),
  body('start_date').optional().isISO8601().toDate(),
  body('duration_days').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['Active', 'Closed', 'Expired']),
];

const eventIdParamValidator = [mongoIdParam('eventId')];

const markParticipantsValidator = [
  mongoIdParam('eventId'),
  body('volunteer_ids')
    .isArray({ min: 1 })
    .withMessage('volunteer_ids must be a non-empty array'),
  body('volunteer_ids.*').isMongoId().withMessage('Each volunteer_id must be a valid Mongo ObjectId'),
  body('status')
    .optional()
    .isIn(PARTICIPATION_STATUS)
    .withMessage(`status must be one of: ${PARTICIPATION_STATUS.join(', ')}`),
];

module.exports = {
  createEventValidator,
  updateEventValidator,
  eventIdParamValidator,
  markParticipantsValidator,
};
