require('dotenv').config();
require('express-async-errors');

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');

const connectDB      = require('./src/config/db');
const logger         = require('./src/utils/logger');
const errorMiddleware = require('./src/middleware/error.middleware');

// ── Route imports ─────────────────────────────────────────
const authRoutes       = require('./src/routes/auth.routes');
const policyRoutes     = require('./src/routes/policy.routes');
const categoryRoutes   = require('./src/routes/category.routes');
const brokerHouseRoutes = require('./src/routes/brokerHouse.routes');
const companyRoutes    = require('./src/routes/company.routes');
const analyticsRoutes  = require('./src/routes/analytics.routes');
const exportRoutes     = require('./src/routes/export.routes');
const activityRoutes   = require('./src/routes/activity.routes');

// ── Connect DB ────────────────────────────────────────────
connectDB();

const app = express();

// ── Security & performance ────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate limiters ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts — please try again later.' },
});

app.use('/api/', globalLimiter);

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HTTP logging (dev only) ───────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ────────────────────────────────────────────
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/policies',     policyRoutes);
app.use('/api/categories',   categoryRoutes);
app.use('/api/broker-houses', brokerHouseRoutes);
app.use('/api/companies',    companyRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/export',       exportRoutes);
app.use('/api/activity',     activityRoutes);

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global error handler (must be last) ───────────────────
app.use(errorMiddleware);

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀  Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
