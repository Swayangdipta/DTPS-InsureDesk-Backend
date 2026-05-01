const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
  {
    // ── Identity ───────────────────────────────────────────
    serialNumber: {
      type:  String,
      trim:  true,
    },
    policyHolderName: {
      type:     String,
      required: [true, 'Policy holder name is required'],
      trim:     true,
    },

    // ── Dates ─────────────────────────────────────────────
    paidDate:        { type: Date },
    policyIssueDate: { type: Date },
    issuedMonth:     { type: String, trim: true },
    doc:             { type: Date },   // Date of Commencement
    nextRenewalDate: { type: Date },

    // ── References ────────────────────────────────────────
    category: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Category',
      required: [true, 'Category is required'],
    },
    brokerHouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'BrokerHouse',
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Company',
    },

    // ── Financials ────────────────────────────────────────
    premiumWithoutGST: { type: Number, min: 0, default: 0 },
    premiumWithGST:    { type: Number, min: 0, default: 0 },
    sumAssured:        { type: Number, min: 0, default: 0 },

    // ── Policy terms ──────────────────────────────────────
    premiumPayingTerm: { type: Number, min: 0 },  // PPT in years
    policyTerm:        { type: Number, min: 0 },  // PT in years

    // ── Statuses ──────────────────────────────────────────
    systemUpdateStatus: { type: String, trim: true },
    bondStatus: {
      type:    String,
      enum:    ['Pending', 'Received', 'Dispatched', 'NA'],
      default: 'Pending',
    },
    paymentStatus: {
      type:    String,
      enum:    ['Paid', 'Unpaid', 'Bounced', 'Partial'],
      default: 'Unpaid',
    },
    payoutStatus: {
      type:    String,
      enum:    ['Due', 'Paid', 'NA'],
      default: 'Due',
    },

    // ── Advisors ──────────────────────────────────────────
    advisorName:   { type: String, trim: true },
    advisorLevel3: { type: String, trim: true },
    advisorLevel4: { type: String, trim: true },

    // ── Misc ──────────────────────────────────────────────
    remarks:      { type: String, trim: true },
    isBookmarked: { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },

    // ── Audit ─────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes for fast filtering ────────────────────────────
policySchema.index({ policyHolderName: 'text', advisorName: 'text', serialNumber: 'text' });
policySchema.index({ category: 1 });
policySchema.index({ brokerHouse: 1 });
policySchema.index({ company: 1 });
policySchema.index({ paymentStatus: 1 });
policySchema.index({ bondStatus: 1 });
policySchema.index({ payoutStatus: 1 });
policySchema.index({ nextRenewalDate: 1 });
policySchema.index({ paidDate: 1 });
policySchema.index({ policyIssueDate: 1 });
policySchema.index({ isActive: 1, createdAt: -1 });

// ── Virtual: row highlight color (used in UI & exports) ───
policySchema.virtual('rowColor').get(function () {
  if (this.paymentStatus === 'Bounced') return 'red';
  if (this.paymentStatus === 'Paid' && this.bondStatus === 'Received') return 'green';
  if (this.paymentStatus === 'Paid' && this.payoutStatus === 'Due') return 'yellow';
  return 'default';
});

module.exports = mongoose.model('Policy', policySchema);
