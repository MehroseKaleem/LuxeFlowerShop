const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/prisma');
const app = require('./app');

const server = app.listen(env.port, () => {
  logger.info(`${env.appName} API server listening on port ${env.port} [${env.nodeEnv}]`);
});

async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed. Process exiting.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack}`);
  process.exit(1);
});
