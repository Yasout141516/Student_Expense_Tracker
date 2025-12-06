const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Budget must belong to a user']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null // null means overall budget (not category-specific)
  },
  month: {
    type: Date,
    required: [true, 'Please provide a month'],
    // Store as first day of month (e.g., 2024-12-01)
  },
  limitAmount: {
    type: Number,
    required: [true, 'Please provide a budget limit'],
    min: [0, 'Budget limit must be positive']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index: One budget per user/category/month combination
budgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);