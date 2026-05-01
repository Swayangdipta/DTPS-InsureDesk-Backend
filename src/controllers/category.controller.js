const Category = require('../models/Category');

// ── GET /api/categories ───────────────────────────────────
const getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name');
  res.json({ success: true, data: categories });
};

// ── GET /api/categories/:id ───────────────────────────────
const getCategoryById = async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, isActive: true });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.json({ success: true, data: category });
};

// ── POST /api/categories ──────────────────────────────────
const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
};

// ── PUT /api/categories/:id ───────────────────────────────
const updateCategory = async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    req.body,
    { new: true, runValidators: true }
  );
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.json({ success: true, data: category });
};

// ── DELETE /api/categories/:id (soft delete) ──────────────
const deleteCategory = async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { isActive: false },
    { new: true }
  );
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.json({ success: true, message: 'Category deleted successfully' });
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
