const ActivityLog = require('../models/ActivityLog');
const logger      = require('./logger');

/**
 * Log an action to the ActivityLog collection.
 * Fire-and-forget — never throws, never blocks the request.
 *
 * @param {object} options
 * @param {string}   options.userId     - ID of the acting user
 * @param {string}   options.action     - CREATE | UPDATE | DELETE | EXPORT | LOGIN | BULK_IMPORT
 * @param {string}  [options.entityType] - Policy | Category | BrokerHouse | Company | User
 * @param {string}  [options.entityId]   - ObjectId of the affected document
 * @param {object}  [options.details]    - Any extra context (changed fields, count, format…)
 * @param {string}  [options.ip]         - Client IP address
 */
const logActivity = async ({ userId, action, entityType, entityId, details, ip } = {}) => {
  try {
    await ActivityLog.create({
      user:       userId,
      action,
      entityType: entityType || null,
      entityId:   entityId   || null,
      details:    details    || null,
      ipAddress:  ip         || null,
    });
  } catch (err) {
    // Log the failure but never let it crash the main request
    logger.error(`ActivityLog write failed: ${err.message}`);
  }
};

module.exports = { logActivity };
