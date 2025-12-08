const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Expense = require('../models/Expense');

// @desc    Get all budgets for logged-in user with spending data
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    const query = { userId: req.user._id };

    // Get budgets with category details
    const budgets = await Budget.find(query)
      .populate('categoryId', 'type')
      .sort({ createdAt: -1 });

    // Calculate spent amount for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        let spent = 0;

        // Calculate date range based on period
        const now = new Date();
        let startDate, endDate;

        if (budget.period === 'daily') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
        } else if (budget.period === 'weekly') {
          const dayOfWeek = now.getDay();
          startDate = new Date(now.setDate(now.getDate() - dayOfWeek));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        } else if (budget.period === 'monthly') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // Get expenses for this category and period
        const expenses = await Expense.find({
          userId: req.user._id,
          categoryId: budget.categoryId._id,
          date: { $gte: startDate, $lte: endDate }
        });

        spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        return {
          ...budget.toObject(),
          spent
        };
      })
    );

    res.status(200).json({
      success: true,
      count: budgetsWithSpending.length,
      data: budgetsWithSpending
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('categoryId', 'type');

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Make sure user owns this budget
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this budget'
      });
    }

    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res) => {
  try {
    const { categoryId, limit, period } = req.body;

    // Validation
    if (!categoryId || !limit || !period) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category, limit, and period'
      });
    }

    // Verify category exists and belongs to user
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (category.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to use this category'
      });
    }

    // Check if budget already exists for this user/category/period
    const existingBudget = await Budget.findOne({
      userId: req.user._id,
      categoryId: categoryId,
      period: period
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: 'Budget already exists for this category and period'
      });
    }

    // Create budget
    const budget = await Budget.create({
      userId: req.user._id,
      categoryId,
      limit,
      period
    });

    await budget.populate('categoryId', 'type');

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: budget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res) => {
  try {
    let budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Make sure user owns this budget
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this budget'
      });
    }

    // If updating category, verify it exists and belongs to user
    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      if (category.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to use this category'
        });
      }
    }

    // Update budget
    budget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoryId', 'type');

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Make sure user owns this budget
    if (budget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this budget'
      });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget
};