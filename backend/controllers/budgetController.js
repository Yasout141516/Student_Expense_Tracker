const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Expense = require('../models/Expense');

// @desc    Get all budgets for logged-in user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    // Build query
    const query = { userId: req.user._id };

    // Filter by month if provided
    if (req.query.month) {
      query.month = new Date(req.query.month);
    }

    // Get budgets with category details
    const budgets = await Budget.find(query)
      .populate('categoryId', 'type')
      .sort({ month: -1 });

    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets
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
    const { categoryId, month, limitAmount } = req.body;

    // Validation
    if (!month || !limitAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide month and limit amount'
      });
    }

    // If categoryId provided, verify it exists and belongs to user
    if (categoryId) {
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
    }

    // Check if budget already exists for this user/category/month
    const existingBudget = await Budget.findOne({
      userId: req.user._id,
      categoryId: categoryId || null,
      month: new Date(month)
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: 'Budget already exists for this period'
      });
    }

    // Create budget
    const budget = await Budget.create({
      userId: req.user._id,
      categoryId: categoryId || null,
      month: new Date(month),
      limitAmount
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

// @desc    Get current month budget status
// @route   GET /api/budgets/current/status
// @access  Private
const getCurrentBudgetStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get current month start and end
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Get all budgets for current month
    const budgets = await Budget.find({
      userId,
      month: startOfMonth
    }).populate('categoryId', 'type');

    // Get all expenses for current month
    const expenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Calculate spending per category
    const spendingByCategory = {};
    expenses.forEach(expense => {
      const catId = expense.categoryId.toString();
      if (!spendingByCategory[catId]) {
        spendingByCategory[catId] = 0;
      }
      spendingByCategory[catId] += expense.amount;
    });

    // Calculate total spending
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Build budget status
    const budgetStatus = budgets.map(budget => {
      const catId = budget.categoryId ? budget.categoryId._id.toString() : null;
      const spent = catId ? (spendingByCategory[catId] || 0) : totalSpent;
      const remaining = budget.limitAmount - spent;
      const percentage = (spent / budget.limitAmount) * 100;

      // Determine alert level
      let alertLevel = 'safe';
      if (percentage >= 100) {
        alertLevel = 'exceeded';
      } else if (percentage >= 80) {
        alertLevel = 'danger';
      } else if (percentage >= 50) {
        alertLevel = 'warning';
      }

      return {
        budget: budget,
        spent: spent,
        remaining: remaining,
        percentage: Math.round(percentage),
        alertLevel: alertLevel
      };
    });

    res.status(200).json({
      success: true,
      data: {
        budgetStatus,
        period: {
          start: startOfMonth,
          end: endOfMonth
        }
      }
    });
  } catch (error) {
    console.error('Get budget status error:', error);
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
  deleteBudget,
  getCurrentBudgetStatus
};