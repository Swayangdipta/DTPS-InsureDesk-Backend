const Company = require('../models/Company');

// ── GET /api/companies ────────────────────────────────────
// Optionally filter by brokerHouse to drive the cascading dropdown
const getCompanies = async (req, res) => {
  const filter = { isActive: true };
  if (req.query.brokerHouse) filter.brokerHouse = req.query.brokerHouse;

  const companies = await Company.find(filter)
    .populate('brokerHouse', 'name')
    .sort('name');

  res.json({ success: true, data: companies });
};

// ── GET /api/companies/:id ────────────────────────────────
const getCompanyById = async (req, res) => {
  const company = await Company.findOne({ _id: req.params.id, isActive: true })
    .populate('brokerHouse', 'name');
  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found' });
  }
  res.json({ success: true, data: company });
};

// ── POST /api/companies ───────────────────────────────────
const createCompany = async (req, res) => {
  const company = await Company.create(req.body);
  const populated = await Company.findById(company._id).populate('brokerHouse', 'name');
  res.status(201).json({ success: true, data: populated });
};

// ── PUT /api/companies/:id ────────────────────────────────
const updateCompany = async (req, res) => {
  const company = await Company.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    req.body,
    { new: true, runValidators: true }
  ).populate('brokerHouse', 'name');

  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found' });
  }
  res.json({ success: true, data: company });
};

// ── DELETE /api/companies/:id (soft delete) ───────────────
const deleteCompany = async (req, res) => {
  const company = await Company.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { isActive: false },
    { new: true }
  );
  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found' });
  }
  res.json({ success: true, message: 'Company deleted successfully' });
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};
