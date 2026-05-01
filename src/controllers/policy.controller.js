const dayjs  = require('dayjs');
const Policy = require('../models/Policy');
const { buildPolicyFilter } = require('../utils/filterBuilder');
const { logActivity }       = require('../utils/activityLogger');

// ── Shared populate config ────────────────────────────────
const POPULATE = [
  { path: 'category',    select: 'name colorCode' },
  { path: 'brokerHouse', select: 'name' },
  { path: 'company',     select: 'name' },
  { path: 'createdBy',   select: 'fullName' },
];

// ── GET /api/policies ─────────────────────────────────────
const getPolicies = async (req, res) => {
  const {
    page  = 1,
    limit = 25,
    sort  = '-createdAt',
    ...filters
  } = req.query;

  const filter = { ...buildPolicyFilter(filters), isActive: true };

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const [policies, total] = await Promise.all([
    Policy.find(filter)
      .populate(POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean({ virtuals: true }),
    Policy.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: policies,
    pagination: {
      total,
      page:  pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
};

// ── GET /api/policies/:id ─────────────────────────────────
const getPolicyById = async (req, res) => {
  const policy = await Policy.findOne({
    _id:      req.params.id,
    isActive: true,
  })
    .populate([
      ...POPULATE,
      { path: 'updatedBy', select: 'fullName' },
    ])
    .lean({ virtuals: true });

  if (!policy) {
    return res.status(404).json({ success: false, message: 'Policy not found' });
  }

  res.json({ success: true, data: policy });
};

// ── POST /api/policies ────────────────────────────────────
const createPolicy = async (req, res) => {
  const policy = await Policy.create({
    ...req.body,
    createdBy: req.user._id,
  });

  const populated = await Policy.findById(policy._id)
    .populate(POPULATE)
    .lean({ virtuals: true });

  await logActivity({
    userId:     req.user._id,
    action:     'CREATE',
    entityType: 'Policy',
    entityId:   policy._id,
    details:    { policyHolderName: policy.policyHolderName },
    ip:         req.ip,
  });

  res.status(201).json({ success: true, data: populated });
};

// ── PUT /api/policies/:id ─────────────────────────────────
const updatePolicy = async (req, res) => {
  const policy = await Policy.findOne({ _id: req.params.id, isActive: true });

  if (!policy) {
    return res.status(404).json({ success: false, message: 'Policy not found' });
  }

  Object.assign(policy, req.body, { updatedBy: req.user._id });
  await policy.save();

  const populated = await Policy.findById(policy._id)
    .populate(POPULATE)
    .lean({ virtuals: true });

  await logActivity({
    userId:     req.user._id,
    action:     'UPDATE',
    entityType: 'Policy',
    entityId:   policy._id,
    details:    { changes: Object.keys(req.body) },
    ip:         req.ip,
  });

  res.json({ success: true, data: populated });
};

// ── DELETE /api/policies/:id (soft delete) ────────────────
const deletePolicy = async (req, res) => {
  const policy = await Policy.findOne({ _id: req.params.id, isActive: true });

  if (!policy) {
    return res.status(404).json({ success: false, message: 'Policy not found' });
  }

  policy.isActive   = false;
  policy.updatedBy  = req.user._id;
  await policy.save();

  await logActivity({
    userId:     req.user._id,
    action:     'DELETE',
    entityType: 'Policy',
    entityId:   policy._id,
    details:    { policyHolderName: policy.policyHolderName },
    ip:         req.ip,
  });

  res.json({ success: true, message: 'Policy deleted successfully' });
};

// ── PUT /api/policies/:id/bookmark ───────────────────────
const toggleBookmark = async (req, res) => {
  const policy = await Policy.findOne({ _id: req.params.id, isActive: true });

  if (!policy) {
    return res.status(404).json({ success: false, message: 'Policy not found' });
  }

  policy.isBookmarked = !policy.isBookmarked;
  await policy.save();

  res.json({ success: true, data: { isBookmarked: policy.isBookmarked } });
};

// ── POST /api/policies/bulk-import ────────────────────────
const bulkImport = async (req, res) => {
  const { policies } = req.body;

  const withUser = policies.map((p) => ({ ...p, createdBy: req.user._id }));

  // ordered:false — continue even if some docs fail validation
  const result = await Policy.insertMany(withUser, { ordered: false });

  await logActivity({
    userId:     req.user._id,
    action:     'BULK_IMPORT',
    entityType: 'Policy',
    details:    { count: result.length },
    ip:         req.ip,
  });

  res.status(201).json({
    success: true,
    message: `${result.length} policies imported successfully`,
    data:    { count: result.length },
  });
};

// ── GET /api/policies/renewals ────────────────────────────
const getRenewals = async (req, res) => {
  const { days = 60 } = req.query;
  const today  = dayjs().startOf('day').toDate();
  const future = dayjs().add(parseInt(days), 'day').endOf('day').toDate();

  const policies = await Policy.find({
    isActive:       true,
    nextRenewalDate: { $gte: today, $lte: future },
  })
    .populate(POPULATE)
    .sort('nextRenewalDate')
    .lean({ virtuals: true });

  // Group by urgency bands
  const group = (minDay, maxDay) =>
    policies.filter((p) => {
      const d = dayjs(p.nextRenewalDate).diff(dayjs(), 'day');
      return d >= minDay && d <= maxDay;
    });

  res.json({
    success: true,
    data: {
      urgent:   group(0, 7),
      soon:     group(8, 30),
      upcoming: group(31, parseInt(days)),
      total:    policies.length,
    },
  });
};

module.exports = {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  toggleBookmark,
  bulkImport,
  getRenewals,
};
