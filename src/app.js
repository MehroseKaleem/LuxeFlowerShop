const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const logger = require('./config/logger');
const ApiError = require('./utils/ApiError');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const { generalLimiter } = require('./middlewares/rateLimiter');
const paymentsController = require('./modules/payments/payments.controller');
const v1Routes = require('./routes/v1.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, 'Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(compression());

const morganStream = { write: (message) => logger.info(message.trim()) };
app.use(morgan(env.isProd ? 'combined' : 'dev', { stream: morganStream }));

// Stripe webhook needs the raw request body for signature verification, so
// it must be registered BEFORE the global JSON body parser below.
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), paymentsController.webhook);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(hpp());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '7d' }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});

app.use(env.apiPrefix, generalLimiter);
app.use(env.apiPrefix, v1Routes);
app.use(`${env.apiPrefix}/admin`, adminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
