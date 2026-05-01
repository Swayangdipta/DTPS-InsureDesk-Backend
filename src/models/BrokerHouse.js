const mongoose = require('mongoose');

const brokerHouseSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Broker house name is required'],
      unique:   true,
      trim:     true,
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

module.exports = mongoose.model('BrokerHouse', brokerHouseSchema);
