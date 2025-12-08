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
    required: [true, 'Please provide a category']
  },
  limit: {
    type: Number,
    required: [true, 'Please provide a budget limit'],
    min: [0, 'Limit cannot be negative']
  },
  period: {
    type: String,
    required: [true, 'Please specify budget period'],
    enum: ['daily', 'weekly', 'monthly'],
    default: 'monthly'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
budgetSchema.index({ userId: 1, categoryId: 1, period: 1 });

// Compound unique index to prevent duplicate budgets for same category/period
budgetSchema.index({ userId: 1, categoryId: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);