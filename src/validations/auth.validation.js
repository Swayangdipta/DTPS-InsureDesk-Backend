const Joi = require('joi');

const login = Joi.object({
  username: Joi.string().min(3).max(30).lowercase().trim().required()
    .messages({
      'string.min':  'Username must be at least 3 characters',
      'string.max':  'Username cannot exceed 30 characters',
      'any.required':'Username is required',
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min':  'Password must be at least 6 characters',
      'any.required':'Password is required',
    }),
});

const register = Joi.object({
  username: Joi.string().min(3).max(30).lowercase().trim().required()
    .messages({
      'string.min':  'Username must be at least 3 characters',
      'string.max':  'Username cannot exceed 30 characters',
      'any.required':'Username is required',
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min':  'Password must be at least 6 characters',
      'any.required':'Password is required',
    }),
  fullName: Joi.string().min(2).max(80).trim().required()
    .messages({
      'any.required':'Full name is required',
    }),
  role: Joi.string().valid('admin', 'staff').default('staff'),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required()
    .messages({ 'any.required': 'Current password is required' }),
  newPassword: Joi.string().min(6).required()
    .messages({
      'string.min':  'New password must be at least 6 characters',
      'any.required':'New password is required',
    }),
});

module.exports = { login, register, changePassword };
