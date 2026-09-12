const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(
        ({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`
      )
    ),
  }),
  new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '14d',
  }),
  new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
  }),
];

const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
  exitOnError: false,
});

module.exports = logger;
