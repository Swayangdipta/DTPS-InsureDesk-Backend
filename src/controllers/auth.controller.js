const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');

// ── Generate JWT ──────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── POST /api/auth/login ──────────────────────────────────
const login = async (req, res) => {
  const { username, password } = req.body;

  // select('+password') because password has select:false in schema
  const user = await User.findOne({
    username: username.toLowerCase(),
    isActive: true,
  }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
    });
  }

  user.lastLogin = new Date();
  await user.save();

  await logActivity({
    userId: user._id,
    action: 'LOGIN',
    details: { username: user.username },
    ip: req.ip,
  });

  res.json({
    success: true,
    token: generateToken(user._id),
    user: {
      id:       user._id,
      username: user.username,
      fullName: user.fullName,
      role:     user.role,
    },
  });
};

// ── POST /api/auth/register ───────────────────────────────
const register = async (req, res) => {
  const { username, password, fullName, role } = req.body;

  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Username already exists',
    });
  }

  const user = await User.create({ username, password, fullName, role });

  res.status(201).json({
    success: true,
    user: {
      id:       user._id,
      username: user.username,
      fullName: user.fullName,
      role:     user.role,
    },
  });
};

// ── GET /api/auth/me ──────────────────────────────────────
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ── PUT /api/auth/change-password ─────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
};

module.exports = { login, register, getMe, changePassword };
