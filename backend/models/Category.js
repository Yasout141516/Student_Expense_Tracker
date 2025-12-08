const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Category must belong to a user']
  },
  type: {
    type: String,
    required: [true, 'Please provide a category name'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  categoryType: {  // ⭐ ADD THIS FIELD
    type: String,
    required: [true, 'Please specify category type'],
    enum: ['income', 'expense'],  // Only allow these values
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index: Each user can have unique category names per type
categorySchema.index({ userId: 1, type: 1, categoryType: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);