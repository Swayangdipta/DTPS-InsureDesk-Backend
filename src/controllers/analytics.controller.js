const dayjs  = require('dayjs');
const Policy = require('../models/Policy');

// ── GET /api/analytics/overview ──────────────────────────
const getOverview = async (req, res) => {
  const now            = dayjs();
  const startOfMonth   = now.startOf('month').toDate();
  const startLastMonth = now.subtract(1, 'month').startOf('month').toDate();
  const endLastMonth   = now.subtract(1, 'month').endOf('month').toDate();

  const [totals, thisMonth, lastMonth, statusBreakdown] = await Promise.all([
    Policy.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id:                 null,
          totalPolicies:       { $sum: 1 },
          // PRIMARY business metric — ex-GST
          totalPremiumNoGST:   { $sum: '$premiumWithoutGST' },
          totalPremiumWithGST: { $sum: '$premiumWithGST' },
          totalSumAssured:     { $sum: '$sumAssured' },
        },
      },
    ]),
    Policy.countDocuments({ isActive: true, createdAt: { $gte: startOfMonth } }),
    Policy.countDocuments({ isActive: true, createdAt: { $gte: startLastMonth, $lte: endLastMonth } }),
    Policy.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]),
  ]);

  const t      = totals[0] || {};
  const growth = lastMonth > 0
    ? parseFloat((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1))
    : 100;

  res.json({
    success: true,
    data: {
      totalPolicies:       t.totalPolicies       || 0,
      totalPremiumNoGST:   t.totalPremiumNoGST   || 0,  // PRIMARY
      totalPremiumWithGST: t.totalPremiumWithGST || 0,
      totalSumAssured:     t.totalSumAssured      || 0,
      thisMonthPolicies:   thisMonth,
      lastMonthPolicies:   lastMonth,
      growth,
      statusBreakdown: statusBreakdown.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
    },
  });
};

// ── GET /api/analytics/by-category ───────────────────────
// totalPremium = premiumWithoutGST (primary business metric)
const getByCategory = async (req, res) => {
  const data = await Policy.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'categories', localField: 'category',
        foreignField: '_id', as: 'cat',
      },
    },
    { $unwind: '$cat' },
    {
      $group: {
        _id:             '$cat._id',
        name:            { $first: '$cat.name' },
        colorCode:       { $first: '$cat.colorCode' },
        count:           { $sum: 1 },
        totalPremium:    { $sum: '$premiumWithoutGST' }, // ex-GST
        totalSumAssured: { $sum: '$sumAssured' },
      },
    },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data });
};

// ── GET /api/analytics/by-broker ─────────────────────────
const getByBroker = async (req, res) => {
  const data = await Policy.aggregate([
    { $match: { isActive: true, brokerHouse: { $exists: true, $ne: null } } },
    {
      $lookup: {
        from: 'brokerhouses', localField: 'brokerHouse',
        foreignField: '_id', as: 'broker',
      },
    },
    { $unwind: '$broker' },
    {
      $group: {
        _id:          '$broker._id',
        name:         { $first: '$broker.name' },
        count:        { $sum: 1 },
        totalPremium: { $sum: '$premiumWithoutGST' }, // ex-GST
      },
    },
    { $sort: { totalPremium: -1 } },
  ]);
  res.json({ success: true, data });
};

// ── GET /api/analytics/by-company ────────────────────────
const getByCompany = async (req, res) => {
  const data = await Policy.aggregate([
    { $match: { isActive: true, company: { $exists: true, $ne: null } } },
    {
      $lookup: {
        from: 'companies', localField: 'company',
        foreignField: '_id', as: 'comp',
      },
    },
    { $unwind: '$comp' },
    {
      $group: {
        _id:          '$comp._id',
        name:         { $first: '$comp.name' },
        count:        { $sum: 1 },
        totalPremium: { $sum: '$premiumWithoutGST' }, // ex-GST
      },
    },
    { $sort: { totalPremium: -1 } },
    { $limit: 10 },
  ]);
  res.json({ success: true, data });
};

// ── GET /api/analytics/time-series ───────────────────────
const getTimeSeries = async (req, res) => {
  const { groupBy = 'month', from, to } = req.query;

  const matchStage = { isActive: true };
  if (from || to) {
    matchStage.createdAt = {};
    if (from) matchStage.createdAt.$gte = new Date(from);
    if (to)   matchStage.createdAt.$lte = new Date(to);
  }

  const formats = { day: '%Y-%m-%d', month: '%Y-%m', year: '%Y' };
  const fmt     = formats[groupBy] || '%Y-%m';

  const data = await Policy.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id:               { $dateToString: { format: fmt, date: '$createdAt' } },
        count:             { $sum: 1 },
        totalPremiumNoGST: { $sum: '$premiumWithoutGST' }, // ex-GST — primary
        totalPremiumGST:   { $sum: '$premiumWithGST' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0, date: '$_id', count: 1,
        totalPremiumNoGST: 1, totalPremiumGST: 1,
      },
    },
  ]);

  res.json({ success: true, data });
};

// ── GET /api/analytics/calendar ──────────────────────────
const getCalendarData = async (req, res) => {
  const { year = dayjs().year(), month } = req.query;

  const start = month
    ? dayjs(`${year}-${month}-01`).startOf('month').toDate()
    : dayjs(`${year}-01-01`).startOf('year').toDate();
  const end = month
    ? dayjs(`${year}-${month}-01`).endOf('month').toDate()
    : dayjs(`${year}-12-31`).endOf('year').toDate();

  const data = await Policy.aggregate([
    { $match: { isActive: true, paidDate: { $gte: start, $lte: end } } },
    {
      $group: {
        _id:          { $dateToString: { format: '%Y-%m-%d', date: '$paidDate' } },
        count:        { $sum: 1 },
        totalPremium: { $sum: '$premiumWithoutGST' }, // ex-GST
        policies: {
          $push: {
            _id:              '$_id',
            policyHolderName: '$policyHolderName',
            premiumWithGST:   '$premiumWithGST',
            premiumWithoutGST:'$premiumWithoutGST',
            paymentStatus:    '$paymentStatus',
          },
        },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1, totalPremium: 1, policies: 1 } },
  ]);

  res.json({ success: true, data });
};

module.exports = {
  getOverview, getByCategory, getByBroker,
  getByCompany, getTimeSeries, getCalendarData,
};
