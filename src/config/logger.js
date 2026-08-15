const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const env = require('./env');

const logsDir = path.join(__dirname, '..', '..', 'logs');

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }),
);

const fileRotateTransport = new winston.transports.DailyRotateFile({
  dirname: logsDir,
  filename: '%DATE%-app.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '20m',
  level: 'info',
});

const errorRotateTransport = new winston.transports.DailyRotateFile({
  dirname: logsDir,
  filename: '%DATE%-error.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '20m',
  level: 'error',
});

const logger = winston.createLogger({
  level: env.isProd ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [fileRotateTransport, errorRotateTransport],
  exitOnError: false,
});

if (!env.isProd) {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
} else {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      level: 'warn',
    }),
  );
}

module.exports = logger;
