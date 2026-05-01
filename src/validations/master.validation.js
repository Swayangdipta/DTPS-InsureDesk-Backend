const Joi = require('joi');

const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({ 'string.pattern.base': 'Must be a valid ID' });

// ── Category ──────────────────────────────────────────────
const createCategory = Joi.object({
  name: Joi.string().trim().min(1).max(50).required()
    .messages({ 'any.required': 'Category name is required' }),
  description: Joi.string().trim().max(200).allow('', null),
  colorCode: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .default('#6366f1')
    .messages({ 'string.pattern.base': 'Must be a valid hex color e.g. #ff0000' }),
});

const updateCategory = createCategory.fork(
  ['name'],
  (field) => field.optional()
);

// ── Broker House ──────────────────────────────────────────
const createBrokerHouse = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
    .messages({ 'any.required': 'Broker house name is required' }),
});

const updateBrokerHouse = createBrokerHouse.fork(
  ['name'],
  (field) => field.optional()
);

// ── Company ───────────────────────────────────────────────
const createCompany = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
    .messages({ 'any.required': 'Company name is required' }),
  brokerHouse: objectId.required()
    .messages({ 'any.required': 'Broker house is required' }),
});

const updateCompany = createCompany.fork(
  ['name', 'brokerHouse'],
  (field) => field.optional()
);

module.exports = {
  createCategory,  updateCategory,
  createBrokerHouse, updateBrokerHouse,
  createCompany,   updateCompany,
};
