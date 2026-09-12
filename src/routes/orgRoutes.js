const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');
const { getMyEvents } = require('../controllers/orgController');

router.use(protect, authorize('org'));

router.get('/me/events', getMyEvents);

module.exports = router;
