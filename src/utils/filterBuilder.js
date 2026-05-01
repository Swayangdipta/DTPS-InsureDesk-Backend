const mongoose = require('mongoose');

const toObjectId = (val) => {
  if (val && mongoose.Types.ObjectId.isValid(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  return null;
};

const buildPolicyFilter = (query = {}) => {
  const filter = {};

  const {
    search,
    category, brokerHouse, company,
    paymentStatus, bondStatus, payoutStatus,
    advisorName, advisorLevel4,   // Top Leader Name
    isBookmarked,
    issueDateFrom, issueDateTo,
    paidDateFrom, paidDateTo,
    renewalDateFrom, renewalDateTo,
    premiumMin, premiumMax,
  } = query;

  // ── Full-text search ──────────────────────────────────
  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  // ── References ────────────────────────────────────────
  const catId    = toObjectId(category);
  const brokerId = toObjectId(brokerHouse);
  const compId   = toObjectId(company);
  if (catId)    filter.category    = catId;
  if (brokerId) filter.brokerHouse = brokerId;
  if (compId)   filter.company     = compId;

  // ── Status ────────────────────────────────────────────
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (bondStatus)    filter.bondStatus    = bondStatus;
  if (payoutStatus)  filter.payoutStatus  = payoutStatus;

  // ── Advisor name (partial, case-insensitive) ──────────
  // Only applied when there is no $text search to avoid conflict
  if (advisorName && advisorName.trim() && !search) {
    filter.advisorName = { $regex: advisorName.trim(), $options: 'i' };
  }

  // ── Top Leader Name (advisorLevel4) ───────────────────
  if (advisorLevel4 && advisorLevel4.trim()) {
    filter.advisorLevel4 = { $regex: advisorLevel4.trim(), $options: 'i' };
  }

  // ── Bookmark ──────────────────────────────────────────
  if (isBookmarked === 'true' || isBookmarked === true) {
    filter.isBookmarked = true;
  }

  // ── Issue date range ──────────────────────────────────
  if (issueDateFrom || issueDateTo) {
    filter.policyIssueDate = {};
    if (issueDateFrom) filter.policyIssueDate.$gte = new Date(issueDateFrom);
    if (issueDateTo)   filter.policyIssueDate.$lte = new Date(issueDateTo);
  }

  // ── Paid date range ───────────────────────────────────
  if (paidDateFrom || paidDateTo) {
    filter.paidDate = {};
    if (paidDateFrom) filter.paidDate.$gte = new Date(paidDateFrom);
    if (paidDateTo)   filter.paidDate.$lte = new Date(paidDateTo);
  }

  // ── Renewal date range ────────────────────────────────
  if (renewalDateFrom || renewalDateTo) {
    filter.nextRenewalDate = {};
    if (renewalDateFrom) filter.nextRenewalDate.$gte = new Date(renewalDateFrom);
    if (renewalDateTo)   filter.nextRenewalDate.$lte = new Date(renewalDateTo);
  }

  // ── Premium range (WITHOUT GST — primary) ─────────────
  if (premiumMin || premiumMax) {
    filter.premiumWithoutGST = {};
    if (premiumMin) filter.premiumWithoutGST.$gte = parseFloat(premiumMin);
    if (premiumMax) filter.premiumWithoutGST.$lte = parseFloat(premiumMax);
  }

  return filter;
};

module.exports = { buildPolicyFilter };
