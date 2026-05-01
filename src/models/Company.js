const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Company name is required'],
      trim:     true,
    },
    brokerHouse: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'BrokerHouse',
      required: [true, 'Broker house is required'],
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// A company name must be unique within the same broker house
companySchema.index({ name: 1, brokerHouse: 1 }, { unique: true });

module.exports = mongoose.model('Company', companySchema);
