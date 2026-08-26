const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.error(`[env] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const toBool = (val, fallback = false) => (val === undefined ? fallback : val === 'true');
const toInt = (val, fallback) => (val === undefined ? fallback : parseInt(val, 10));
const toList = (val, fallback = []) =>
  val ? val.split(',').map((s) => s.trim()).filter(Boolean) : fallback;

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: toInt(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appName: process.env.APP_NAME || 'Luxeflower',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  adminClientUrl: process.env.ADMIN_CLIENT_URL || 'http://localhost:3001',
  corsOrigins: toList(process.env.CORS_ORIGINS, ['http://localhost:3000']),

  databaseUrl: process.env.DATABASE_URL,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'luxeflower_refresh_token',
  },

  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 12),

  upload: {
    maxFileSizeMb: toInt(process.env.UPLOAD_MAX_FILE_SIZE_MB, 5),
    baseUrl: process.env.UPLOAD_BASE_URL || '/uploads',
  },

  // Optional — when all three are set, uploads go to Cloudinary (optimized,
  // CDN-served) instead of the local disk. Falls back to local disk storage
  // in their absence, which is fine for local development but does not
  // survive most production hosting (ephemeral filesystems, multiple
  // instances), so this should be configured before a real deployment.
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.STRIPE_CURRENCY || 'aed',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: toInt(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME || 'Luxeflower',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@luxefloweruae.com',
  },

  rateLimit: {
    windowMinutes: toInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
    maxGeneral: toInt(process.env.RATE_LIMIT_MAX_GENERAL, 300),
    maxAuth: toInt(process.env.RATE_LIMIT_MAX_AUTH, 20),
    maxAdmin: toInt(process.env.RATE_LIMIT_MAX_ADMIN, 600),
  },

  seed: {
    superAdminName: process.env.SEED_SUPER_ADMIN_NAME || 'Luxeflower Admin',
    superAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@luxefloweruae.com',
    superAdminPhone: process.env.SEED_SUPER_ADMIN_PHONE || '+971500000000',
    superAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD || 'ChangeMe@12345',
  },
};
