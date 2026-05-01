const BrokerHouse = require('../models/BrokerHouse');

// ── GET /api/broker-houses ────────────────────────────────
const getBrokerHouses = async (req, res) => {
  const brokerHouses = await BrokerHouse.find({ isActive: true }).sort('name');
  res.json({ success: true, data: brokerHouses });
};

// ── GET /api/broker-houses/:id ────────────────────────────
const getBrokerHouseById = async (req, res) => {
  const brokerHouse = await BrokerHouse.findOne({ _id: req.params.id, isActive: true });
  if (!brokerHouse) {
    return res.status(404).json({ success: false, message: 'Broker house not found' });
  }
  res.json({ success: true, data: brokerHouse });
};

// ── POST /api/broker-houses ───────────────────────────────
const createBrokerHouse = async (req, res) => {
  const brokerHouse = await BrokerHouse.create(req.body);
  res.status(201).json({ success: true, data: brokerHouse });
};

// ── PUT /api/broker-houses/:id ────────────────────────────
const updateBrokerHouse = async (req, res) => {
  const brokerHouse = await BrokerHouse.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    req.body,
    { new: true, runValidators: true }
  );
  if (!brokerHouse) {
    return res.status(404).json({ success: false, message: 'Broker house not found' });
  }
  res.json({ success: true, data: brokerHouse });
};

// ── DELETE /api/broker-houses/:id (soft delete) ───────────
const deleteBrokerHouse = async (req, res) => {
  const brokerHouse = await BrokerHouse.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { isActive: false },
    { new: true }
  );
  if (!brokerHouse) {
    return res.status(404).json({ success: false, message: 'Broker house not found' });
  }
  res.json({ success: true, message: 'Broker house deleted successfully' });
};

module.exports = {
  getBrokerHouses,
  getBrokerHouseById,
  createBrokerHouse,
  updateBrokerHouse,
  deleteBrokerHouse,
};
