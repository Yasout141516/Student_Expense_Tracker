const Category = require('../models/Category');

// @desc    Get all categories for logged-in user
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    // Get all user's categories
    const categories = await Category.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Make sure user owns this category
    if (category.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this category'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    console.log('=== CREATE CATEGORY REQUEST ===');
    console.log('Body:', req.body);
    console.log('User:', req.user._id);
    
    const { type, categoryType } = req.body;

    // Validation
    if (!type) {
      console.log('Error: No type provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide category name'
      });
    }

    if (!categoryType) {
      console.log('Error: No categoryType provided');
      return res.status(400).json({
        success: false,
        message: 'Please specify category type (income or expense)'
      });
    }

    console.log('Creating category:', { userId: req.user._id, type, categoryType });

    // Create category
    const category = await Category.create({
      userId: req.user._id,
      type,
      categoryType
    });

    console.log('Category created successfully:', category);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('=== CREATE CATEGORY ERROR ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle duplicate category error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Make sure user owns this category
    if (category.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category'
      });
    }

    // Check for duplicate category name
    if (req.body.type && req.body.type !== category.type) {
      const existingCategory = await Category.findOne({
        userId: req.user._id,
        type: req.body.type
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update category
    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Make sure user owns this category
    if (category.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this category'
      });
    }

    // Check if category is being used in expenses
    const Expense = require('../models/Expense');
    const expenseCount = await Expense.countDocuments({ categoryId: req.params.id });

    if (expenseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is being used by ${expenseCount} expense(s)`
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};

