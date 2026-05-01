const logger = require('../utils/logger');

// ── Global error handler ──────────────────────────────────
// Must have 4 params for Express to treat it as error middleware
const errorMiddleware = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal server error';

  // ── Mongoose: bad ObjectId ────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid ID format: ${err.value}`;
  }

  // ── Mongoose: duplicate key ───────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message    = `Duplicate value for field: ${field}`;
  }

  // ── Mongoose: validation error ────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // ── JWT errors ────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token expired';
  }

  // ── Log server errors ─────────────────────────────────
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${err.stack || err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
