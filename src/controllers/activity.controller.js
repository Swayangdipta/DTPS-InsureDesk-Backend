const ActivityLog = require('../models/ActivityLog');

// ── GET /api/activity ─────────────────────────────────────
// Supports filtering by action, entityType, user, and date range
const getActivityLogs = async (req, res) => {
  const {
    page       = 1,
    limit      = 30,
    action,
    entityType,
    userId,
    from,
    to,
  } = req.query;

  const filter = {};
  if (action)     filter.action     = action;
  if (entityType) filter.entityType = entityType;
  if (userId)     filter.user       = userId;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to)   filter.createdAt.$lte = new Date(to);
  }

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user', 'fullName username')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      total,
      page:  pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
};

module.exports = { getActivityLogs };
