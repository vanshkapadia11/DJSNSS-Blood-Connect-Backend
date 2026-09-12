const express = require('express');
const router = express.Router();
const { param } = require('express-validator');

const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const {
  listVolunteers,
  getVolunteerById,
  removeVolunteer,
  listOrgs,
  getOrgById,
  listEvents,
  getEventById,
  deleteEvent,
} = require('../controllers/adminController');

const idParam = [param('id').isMongoId().withMessage('id must be a valid Mongo ObjectId')];

router.use(protect, authorize('admin'));

router.get('/volunteers', listVolunteers);
router.get('/volunteers/:id', idParam, validate, getVolunteerById);
router.delete('/volunteers/:id', idParam, validate, removeVolunteer);

router.get('/orgs', listOrgs);
router.get('/orgs/:id', idParam, validate, getOrgById);

router.get('/events', listEvents);
router.get('/events/:id', idParam, validate, getEventById);
router.delete('/events/:id', idParam, validate, deleteEvent);

module.exports = router;
