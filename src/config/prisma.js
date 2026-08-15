const { PrismaClient } = require('@prisma/client');
const env = require('./env');

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: env.isProd ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!env.isProd) {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
