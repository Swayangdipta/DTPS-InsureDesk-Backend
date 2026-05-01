const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
      trim:      true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    password: {
      type:     String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:   false, // never returned in queries by default
    },
    fullName: {
      type:     String,
      required: [true, 'Full name is required'],
      trim:     true,
    },
    role: {
      type:    String,
      enum:    ['admin', 'staff'],
      default: 'staff',
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ── Hash password before saving ───────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare passwords ───────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Remove sensitive fields from JSON output ──────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
