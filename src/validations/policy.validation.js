const Joi = require('joi');

// ── Reusable sub-schemas ──────────────────────────────────
const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Must be a valid ID' });

const positiveNumber = Joi.number().min(0).precision(2);

// ── Create policy ─────────────────────────────────────────
const createPolicy = Joi.object({
  // Identity
  serialNumber:     Joi.string().trim().max(50).allow('', null),
  policyHolderName: Joi.string().trim().min(2).max(120).required()
    .messages({ 'any.required': 'Policy holder name is required' }),

  // References
  category:    objectId.required()
    .messages({ 'any.required': 'Category is required' }),
  brokerHouse: objectId.allow('', null),
  company:     objectId.allow('', null),

  // Dates
  paidDate:        Joi.date().iso().allow(null),
  policyIssueDate: Joi.date().iso().allow(null),
  issuedMonth:     Joi.string().trim().max(20).allow('', null),
  doc:             Joi.date().iso().allow(null),
  nextRenewalDate: Joi.date().iso().allow(null),

  // Financials
  premiumWithoutGST: positiveNumber.default(0),
  premiumWithGST:    positiveNumber.default(0),
  sumAssured:        positiveNumber.default(0),

  // Terms
  premiumPayingTerm: Joi.number().integer().min(0).allow(null),
  policyTerm:        Joi.number().integer().min(0).allow(null),

  // Statuses
  systemUpdateStatus: Joi.string().trim().max(50).allow('', null),
  bondStatus:    Joi.string().valid('Pending', 'Received', 'Dispatched', 'NA').default('Pending'),
  paymentStatus: Joi.string().valid('Paid', 'Unpaid', 'Bounced', 'Partial').default('Unpaid'),
  payoutStatus:  Joi.string().valid('Due', 'Paid', 'NA').default('Due'),

  // Advisors
  advisorName:   Joi.string().trim().max(80).allow('', null),
  advisorLevel3: Joi.string().trim().max(80).allow('', null),
  advisorLevel4: Joi.string().trim().max(80).allow('', null),

  // Misc
  remarks:      Joi.string().trim().max(500).allow('', null),
  isBookmarked: Joi.boolean().default(false),
});

// ── Update policy (all fields optional) ───────────────────
const updatePolicy = createPolicy.fork(
  ['policyHolderName', 'category'],
  (field) => field.optional()
);

// ── Bulk import (array of policies) ──────────────────────
const bulkImport = Joi.object({
  policies: Joi.array()
    .items(createPolicy)
    .min(1)
    .max(500)
    .required()
    .messages({
      'array.min': 'At least 1 policy is required',
      'array.max': 'Cannot import more than 500 policies at once',
    }),
});

module.exports = { createPolicy, updatePolicy, bulkImport };
