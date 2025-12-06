const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: [true, 'Category must belong to a user']
  },
  type: {
    type: String,
    required: [true, 'Please provide a category type'],
    trim: true,
    maxlength: [50, 'Category type cannot exceed 50 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index: Each user can have unique category names
categorySchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);