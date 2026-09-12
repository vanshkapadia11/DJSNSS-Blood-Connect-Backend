const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/events', require('./eventRoutes'));
router.use('/volunteer', require('./volunteerRoutes'));
router.use('/org', require('./orgRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
