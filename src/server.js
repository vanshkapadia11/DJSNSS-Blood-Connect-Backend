require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

let server;

const start = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

start();

// ---------- Graceful shutdown & crash safety ----------
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason && reason.stack ? reason.stack : reason}`);
  // Let it crash intentionally after logging - a process manager (PM2/Docker) should restart it,
  // since continuing in an unknown state is riskier than a clean restart.
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack}`);
  process.exit(1);
});
