const Income = require('../models/Income');
const Category = require('../models/Category');

// @desc    Get all incomes for logged-in user
// @route   GET /api/incomes
// @access  Private
const getIncomes = async (req, res) => {
  try {
    // Build query object
    const query = { userId: req.user._id };

    // Filter by category if provided
    if (req.query.categoryId) {
      query.categoryId = req.query.categoryId;
    }

    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Get incomes with category details populated
    const incomes = await Income.find(query)
      .populate('categoryId', 'type')
      .sort({ date: -1 });

    // Calculate total
    const total = incomes.reduce((sum, income) => sum + income.amount, 0);

    res.status(200).json({
      success: true,
      count: incomes.length,
      total: total,
      data: incomes
    });
  } catch (error) {
    console.error('Get incomes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single income
// @route   GET /api/incomes/:id
// @access  Private
const getIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id)
      .populate('categoryId', 'type');

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Make sure user owns this income
    if (income.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this income'
      });
    }

    res.status(200).json({
      success: true,
      data: income
    });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new income
// @route   POST /api/incomes
// @access  Private
const createIncome = async (req, res) => {
  try {
    const { categoryId, amount, date, note } = req.body;

    // Validation
    if (!categoryId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category and amount'
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

    // Create income
    const income = await Income.create({
      userId: req.user._id,
      categoryId,
      amount,
      date: date || Date.now(),
      note
    });

    // Populate category details
    await income.populate('categoryId', 'type');

    res.status(201).json({
      success: true,
      message: 'Income created successfully',
      data: income
    });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update income
// @route   PUT /api/incomes/:id
// @access  Private
const updateIncome = async (req, res) => {
  try {
    let income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Make sure user owns this income
    if (income.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this income'
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

    // Update income
    income = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoryId', 'type');

    res.status(200).json({
      success: true,
      message: 'Income updated successfully',
      data: income
    });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete income
// @route   DELETE /api/incomes/:id
// @access  Private
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    // Make sure user owns this income
    if (income.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this income'
      });
    }

    await income.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Income deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get income statistics
// @route   GET /api/incomes/stats/summary
// @access  Private
const getIncomeStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get current month incomes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Total this month
    const monthlyIncomes = await Income.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalThisMonth = monthlyIncomes.reduce((sum, inc) => sum + inc.amount, 0);

    // By category
    const byCategory = await Income.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          categoryName: '$category.type',
          total: 1,
          count: 1
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalThisMonth,
        incomeCount: monthlyIncomes.length,
        byCategory,
        period: {
          start: startOfMonth,
          end: endOfMonth
        }
      }
    });
  } catch (error) {
    console.error('Get income stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeStats
};