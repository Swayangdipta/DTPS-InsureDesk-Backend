const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Category name is required'],
      unique:   true,
      trim:     true,
    },
    description: {
      type:  String,
      trim:  true,
      default: '',
    },
    colorCode: {
      type:    String,
      default: '#6366f1',
      match:   [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color code'],
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

module.exports = mongoose.model('Category', categorySchema);
