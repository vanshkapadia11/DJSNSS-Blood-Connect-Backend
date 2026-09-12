const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middlewares/auth');
const { getMyEvents, updateProfile } = require('../controllers/volunteerController');

router.use(protect, authorize('volunteer'));

router.get('/me/events', getMyEvents);
router.put('/me', updateProfile);

module.exports = router;
