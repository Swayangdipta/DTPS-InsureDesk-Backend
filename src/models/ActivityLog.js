const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },
    // Action type: CREATE | UPDATE | DELETE | EXPORT | LOGIN | BULK_IMPORT
    action: {
      type:     String,
      required: true,
      enum:     ['CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'BULK_IMPORT'],
    },
    // Which collection was affected
    entityType: {
      type: String,
      enum: ['Policy', 'Category', 'BrokerHouse', 'Company', 'User', null],
    },
    // ID of the affected document
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    // Extra context (e.g. changed fields, export format, count)
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
