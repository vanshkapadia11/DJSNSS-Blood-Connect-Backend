const express = require('express');
const router = express.Router();

const { registerVolunteer, registerOrg, login, getMe } = require('../controllers/authController');
const { registerVolunteerValidator, registerOrgValidator, loginValidator } = require('../validators/authValidators');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');

router.use(authLimiter); // stricter rate limit for all auth routes

router.post('/volunteer/register', registerVolunteerValidator, validate, registerVolunteer);
router.post('/org/register', registerOrgValidator, validate, registerOrg);
router.post('/login', loginValidator, validate, login);
router.get('/me', protect, getMe);

module.exports = router;
