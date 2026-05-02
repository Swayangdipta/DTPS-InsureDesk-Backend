const Joi = require('joi');

// ── Reusable sub-schemas ──────────────────────────────────
const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Must be a valid ID' });

const positiveNumber = Joi.number().min(0).precision(2);

// ── Create policy ─────────────────────────────────────────
const createPolicy = Joi.object({
  serialNumber:     Joi.string().trim().max(50).allow('', null),
  policyHolderName: Joi.string().trim().min(2).max(120).required()
    .messages({ 'any.required': 'Policy holder name is required' }),

  category:    objectId.required()
    .messages({ 'any.required': 'Category is required' }),
  brokerHouse: objectId.allow('', null),
  company:     objectId.allow('', null),

  paidDate:        Joi.date().allow(null, ''),
  policyIssueDate: Joi.date().allow(null, ''),
  issuedMonth:     Joi.string().trim().max(20).allow('', null),
  doc:             Joi.date().allow(null, ''),
  nextRenewalDate: Joi.date().allow(null, ''),

  premiumWithoutGST: positiveNumber.default(0),
  premiumWithGST:    positiveNumber.default(0),
  sumAssured:        positiveNumber.default(0),

  // allow decimals — Mongoose stores as Number anyway
  premiumPayingTerm: Joi.number().min(0).allow(null, ''),
  policyTerm:        Joi.number().min(0).allow(null, ''),

  systemUpdateStatus: Joi.string().trim().max(50).allow('', null),
  bondStatus:    Joi.string().valid('Pending', 'Received', 'Dispatched', 'NA').default('Pending'),
  paymentStatus: Joi.string().valid('Paid', 'Unpaid', 'Bounced', 'Partial').default('Unpaid'),
  payoutStatus:  Joi.string().valid('Due', 'Paid', 'NA').default('Due'),

  advisorName:   Joi.string().trim().max(80).allow('', null),
  advisorLevel3: Joi.string().trim().max(80).allow('', null),
  advisorLevel4: Joi.string().trim().max(80).allow('', null),

  remarks:      Joi.string().trim().max(500).allow('', null),
  isBookmarked: Joi.boolean().default(false),
});

// ── Update policy (all fields optional) ───────────────────
const updatePolicy = createPolicy.fork(
  ['policyHolderName', 'category'],
  (field) => field.optional()
);

// ── Bulk import item — much more lenient than createPolicy ─
// Only name + category required. Everything else is optional
// and permissive because Excel data is messy.
const bulkImportItem = Joi.object({
  serialNumber:     Joi.string().trim().max(50).allow('', null),
  policyHolderName: Joi.string().trim().min(1).max(120).required()
    .messages({ 'any.required': 'Policy holder name is required' }),

  category:    objectId.required()
    .messages({ 'any.required': 'Category is required' }),
  brokerHouse: objectId.allow('', null),
  company:     objectId.allow('', null),

  // Dates — accept anything date-like, no .iso() restriction
  paidDate:        Joi.date().allow(null, ''),
  policyIssueDate: Joi.date().allow(null, ''),
  issuedMonth:     Joi.string().trim().max(30).allow('', null),
  doc:             Joi.date().allow(null, ''),
  nextRenewalDate: Joi.date().allow(null, ''),

  // Financials — no precision restriction, coerce strings to numbers
  premiumWithoutGST: Joi.number().min(0).allow(null, ''),
  premiumWithGST:    Joi.number().min(0).allow(null, ''),
  sumAssured:        Joi.number().min(0).allow(null, ''),
  premiumPayingTerm: Joi.number().min(0).allow(null, ''),
  policyTerm:        Joi.number().min(0).allow(null, ''),

  systemUpdateStatus: Joi.string().trim().max(100).allow('', null),

  // Status fields — allow any string, fall back gracefully
  bondStatus:    Joi.string().valid('Pending', 'Received', 'Dispatched', 'NA', 'Issued', 'Returned', 'Hold').allow('', null),
  paymentStatus: Joi.string().valid('Paid', 'Unpaid', 'Bounced', 'Partial', 'Dtps', 'Returned').allow('', null),
  payoutStatus:  Joi.string().valid('Due', 'Paid', 'NA', 'Unpaid', 'Returned').allow('', null),

  advisorName:   Joi.string().trim().max(120).allow('', null),
  advisorLevel3: Joi.string().trim().max(120).allow('', null),
  advisorLevel4: Joi.string().trim().max(120).allow('', null),

  remarks:      Joi.string().trim().max(1000).allow('', null),
  isBookmarked: Joi.boolean().default(false),
}).options({ stripUnknown: true });

// ── Bulk import wrapper ───────────────────────────────────
const bulkImport = Joi.object({
  policies: Joi.array()
    .items(bulkImportItem)
    .min(1)
    .max(500)
    .required()
    .messages({
      'array.min': 'At least 1 policy is required',
      'array.max': 'Cannot import more than 500 policies at once',
    }),
});

module.exports = { createPolicy, updatePolicy, bulkImport };
