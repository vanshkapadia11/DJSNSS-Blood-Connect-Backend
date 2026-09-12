const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');

const logger = require('./utils/logger');
const { globalLimiter } = require('./middlewares/rateLimiter');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

// Trust first proxy (needed for correct client IPs behind a load balancer,
// and for express-rate-limit / secure cookies to work correctly)
app.set('trust proxy', 1);

// ---------- Security & core middleware ----------
app.use(helmet()); // sets a range of secure HTTP headers

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // allow non-browser requests (curl/postman -> no origin header)
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' })); // body size limit against payload-based DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression());
app.use(mongoSanitize()); // strips $ and . from req.body/query/params to prevent NoSQL injection
app.use(hpp()); // protects against HTTP parameter pollution

app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.use(globalLimiter); // global rate limiting

// ---------- Health check ----------
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK', uptime: process.uptime() });
});

// ---------- API routes ----------
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
app.use(API_PREFIX, routes);

// ---------- 404 + error handler (must be last) ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
