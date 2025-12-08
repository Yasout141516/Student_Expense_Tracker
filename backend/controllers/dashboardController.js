const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Category = require('../models/Category');

// Helper function to get date ranges
const getDateRanges = () => {
  // Current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  // Previous month
  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  startOfLastMonth.setHours(0, 0, 0, 0);

  const endOfLastMonth = new Date();
  endOfLastMonth.setDate(0);
  endOfLastMonth.setHours(23, 59, 59, 999);

  // Current year
  const startOfYear = new Date();
  startOfYear.setMonth(0);
  startOfYear.setDate(1);
  startOfYear.setHours(0, 0, 0, 0);

  return {
    startOfMonth,
    endOfMonth,
    startOfLastMonth,
    endOfLastMonth,
    startOfYear
  };
};

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startOfMonth, endOfMonth } = getDateRanges();

    // Get current month expenses
    const expenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expenseCount = expenses.length;

    // Get current month income
    const incomes = await Income.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const incomeCount = incomes.length;

    // Calculate savings and balance
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(2) : 0;

    // Get top 3 spending categories
    const topCategories = await Expense.aggregate([
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
        $sort: { total: -1 }
      },
      {
        $limit: 3
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
          count: 1,
          percentage: {
            $multiply: [
              { $divide: ['$total', totalExpenses || 1] },
              100
            ]
          }
        }
      }
    ]);

    // Get active goals summary
    const goals = await Goal.find({ userId, isCompleted: false });
    const goalsSummary = {
      total: goals.length,
      totalTargetAmount: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
      totalCurrentAmount: goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
      averageProgress: goals.length > 0
        ? (goals.reduce((sum, goal) => sum + ((goal.currentAmount / goal.targetAmount) * 100), 0) / goals.length).toFixed(2)
        : 0
    };

    // Get budget status count
    const budgets = await Budget.find({
      userId,
      month: startOfMonth
    });

    let budgetAlerts = {
      exceeded: 0,
      danger: 0,
      warning: 0,
      safe: 0
    };

    for (const budget of budgets) {
      const categoryExpenses = await Expense.find({
        userId,
        categoryId: budget.categoryId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const spent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const percentage = (spent / budget.limitAmount) * 100;

      if (percentage >= 100) budgetAlerts.exceeded++;
      else if (percentage >= 80) budgetAlerts.danger++;
      else if (percentage >= 50) budgetAlerts.warning++;
      else budgetAlerts.safe++;
    }

    res.status(200).json({
      success: true,
      data: {
        period: {
          start: startOfMonth,
          end: endOfMonth
        },
        overview: {
          totalIncome,
          totalExpenses,
          savings,
          savingsRate: parseFloat(savingsRate),
          transactionCount: expenseCount + incomeCount
        },
        expenses: {
          total: totalExpenses,
          count: expenseCount,
          average: expenseCount > 0 ? (totalExpenses / expenseCount).toFixed(2) : 0
        },
        income: {
          total: totalIncome,
          count: incomeCount,
          average: incomeCount > 0 ? (totalIncome / incomeCount).toFixed(2) : 0
        },
        topCategories,
        goals: goalsSummary,
        budgetAlerts
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get burn rate (spending velocity)
// @route   GET /api/dashboard/burn-rate
// @access  Private
const getBurnRate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startOfMonth, endOfMonth } = getDateRanges();

    // Get all expenses this month
    const expenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: 1 });

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate days elapsed in month
    const today = new Date();
    const daysElapsed = today.getDate();
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = totalDaysInMonth - daysElapsed;

    // Calculate burn rates
    const dailyBurnRate = daysElapsed > 0 ? (totalSpent / daysElapsed).toFixed(2) : 0;
    const weeklyBurnRate = daysElapsed > 0 ? ((totalSpent / daysElapsed) * 7).toFixed(2) : 0;
    const monthlyBurnRate = totalSpent.toFixed(2);
    const projectedMonthlySpend = daysElapsed > 0 
      ? ((totalSpent / daysElapsed) * totalDaysInMonth).toFixed(2) 
      : 0;

    // Get total income this month
    const incomes = await Income.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    // Calculate runway (days until money runs out)
    const remainingBalance = totalIncome - totalSpent;
    const runway = dailyBurnRate > 0 
      ? Math.floor(remainingBalance / parseFloat(dailyBurnRate))
      : Infinity;

    // Daily spending data for chart
    const dailySpending = {};
    expenses.forEach(expense => {
      const day = new Date(expense.date).getDate();
      if (!dailySpending[day]) {
        dailySpending[day] = 0;
      }
      dailySpending[day] += expense.amount;
    });

    // Convert to array format for frontend charts
    const dailySpendingArray = [];
    for (let i = 1; i <= daysElapsed; i++) {
      dailySpendingArray.push({
        day: i,
        amount: dailySpending[i] || 0
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: {
          start: startOfMonth,
          end: endOfMonth,
          daysElapsed,
          daysRemaining,
          totalDays: totalDaysInMonth
        },
        burnRate: {
          daily: parseFloat(dailyBurnRate),
          weekly: parseFloat(weeklyBurnRate),
          monthly: parseFloat(monthlyBurnRate)
        },
        projections: {
          projectedMonthlySpend: parseFloat(projectedMonthlySpend),
          totalIncome,
          remainingBalance,
          runway: runway === Infinity ? 'Unlimited' : `${runway} days`
        },
        dailySpending: dailySpendingArray
      }
    });
  } catch (error) {
    console.error('Get burn rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get spending trends (comparison over time)
// @route   GET /api/dashboard/trends
// @access  Private
const getSpendingTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startOfMonth, endOfMonth, startOfLastMonth, endOfLastMonth } = getDateRanges();

    // Current month expenses
    const currentMonthExpenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Last month expenses
    const lastMonthExpenses = await Expense.find({
      userId,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate change
    const change = currentMonthTotal - lastMonthTotal;
    const changePercentage = lastMonthTotal > 0 
      ? ((change / lastMonthTotal) * 100).toFixed(2)
      : 0;

    // Get last 6 months data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format monthly data for charts
    const monthlyTrends = monthlyData.map(item => ({
      year: item._id.year,
      month: item._id.month,
      monthName: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
      total: item.total,
      count: item.count,
      average: (item.total / item.count).toFixed(2)
    }));

    // Category-wise comparison
    const categoryComparison = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          date: { 
            $gte: startOfLastMonth,
            $lte: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: {
            categoryId: '$categoryId',
            month: {
              $cond: [
                { $gte: ['$date', startOfMonth] },
                'current',
                'last'
              ]
            }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $group: {
          _id: '$_id.categoryId',
          categoryName: { $first: '$category.type' },
          currentMonth: {
            $sum: {
              $cond: [{ $eq: ['$_id.month', 'current'] }, '$total', 0]
            }
          },
          lastMonth: {
            $sum: {
              $cond: [{ $eq: ['$_id.month', 'last'] }, '$total', 0]
            }
          }
        }
      },
      {
        $project: {
          categoryName: 1,
          currentMonth: 1,
          lastMonth: 1,
          change: { $subtract: ['$currentMonth', '$lastMonth'] },
          changePercentage: {
            $cond: [
              { $eq: ['$lastMonth', 0] },
              0,
              {
                $multiply: [
                  { $divide: [{ $subtract: ['$currentMonth', '$lastMonth'] }, '$lastMonth'] },
                  100
                ]
              }
            ]
          }
        }
      },
      {
        $sort: { currentMonth: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        comparison: {
          currentMonth: currentMonthTotal,
          lastMonth: lastMonthTotal,
          change,
          changePercentage: parseFloat(changePercentage),
          trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
        },
        monthlyTrends,
        categoryComparison
      }
    });
  } catch (error) {
    console.error('Get spending trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get recent transactions
// @route   GET /api/dashboard/recent-transactions
// @access  Private
const getRecentTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent expenses
    const recentExpenses = await Expense.find({ userId })
      .populate('categoryId', 'type')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

    // Get recent incomes
    const recentIncomes = await Income.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

    // Combine and sort
    const transactions = [
      ...recentExpenses.map(exp => ({
        _id: exp._id,
        type: 'expense',
        amount: exp.amount,
        category: exp.categoryId ? exp.categoryId.type : 'Uncategorized',
        note: exp.note,
        date: exp.date,
        createdAt: exp.createdAt
      })),
      ...recentIncomes.map(inc => ({
        _id: inc._id,
        type: 'income',
        amount: inc.amount,
        category: inc.incomeType,
        note: inc.description,
        date: inc.date,
        createdAt: inc.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get financial health score
// @route   GET /api/dashboard/health-score
// @access  Private
const getFinancialHealthScore = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startOfMonth, endOfMonth } = getDateRanges();

    let score = 0;
    const factors = [];

    // Factor 1: Savings rate (30 points max)
    const expenses = await Expense.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const incomes = await Income.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const savingsPoints = Math.min(Math.max(savingsRate, 0), 30);
    score += savingsPoints;
    factors.push({
      factor: 'Savings Rate',
      value: `${savingsRate.toFixed(2)}%`,
      points: savingsPoints.toFixed(2),
      maxPoints: 30,
      status: savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : 'needs improvement'
    });

    // Factor 2: Budget adherence (25 points max)
    const budgets = await Budget.find({
      userId,
      month: startOfMonth
    });

    let budgetAdherence = 0;
    if (budgets.length > 0) {
      let withinBudgetCount = 0;

      for (const budget of budgets) {
        const categoryExpenses = await Expense.find({
          userId,
          categoryId: budget.categoryId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const spent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        if (spent <= budget.limitAmount) {
          withinBudgetCount++;
        }
      }

      budgetAdherence = (withinBudgetCount / budgets.length) * 100;
      const budgetPoints = (budgetAdherence / 100) * 25;
      score += budgetPoints;

      factors.push({
        factor: 'Budget Adherence',
        value: `${budgetAdherence.toFixed(2)}%`,
        points: budgetPoints.toFixed(2),
        maxPoints: 25,
        status: budgetAdherence >= 80 ? 'excellent' : budgetAdherence >= 60 ? 'good' : 'needs improvement'
      });
    } else {
      factors.push({
        factor: 'Budget Adherence',
        value: 'No budgets set',
        points: 0,
        maxPoints: 25,
        status: 'needs improvement'
      });
    }

    // Factor 3: Goal progress (20 points max)
    const goals = await Goal.find({ userId, isCompleted: false });

    let goalProgress = 0;
    if (goals.length > 0) {
      goalProgress = goals.reduce((sum, goal) => {
        return sum + ((goal.currentAmount / goal.targetAmount) * 100);
      }, 0) / goals.length;

      const goalPoints = (goalProgress / 100) * 20;
      score += goalPoints;

      factors.push({
        factor: 'Goal Progress',
        value: `${goalProgress.toFixed(2)}%`,
        points: goalPoints.toFixed(2),
        maxPoints: 20,
        status: goalProgress >= 50 ? 'excellent' : goalProgress >= 25 ? 'good' : 'needs improvement'
      });
    } else {
      factors.push({
        factor: 'Goal Progress',
        value: 'No active goals',
        points: 0,
        maxPoints: 20,
        status: 'needs improvement'
      });
    }

    // Factor 4: Expense tracking consistency (15 points max)
    const daysElapsed = new Date().getDate();
    const daysWithExpenses = new Set(expenses.map(exp => new Date(exp.date).getDate())).size;
    const trackingConsistency = (daysWithExpenses / daysElapsed) * 100;
    const trackingPoints = (trackingConsistency / 100) * 15;
    score += trackingPoints;

    factors.push({
      factor: 'Tracking Consistency',
      value: `${trackingConsistency.toFixed(2)}%`,
      points: trackingPoints.toFixed(2),
      maxPoints: 15,
      status: trackingConsistency >= 70 ? 'excellent' : trackingConsistency >= 50 ? 'good' : 'needs improvement'
    });

    // Factor 5: Emergency fund / reserves (10 points max)
    // Simplified: if savings > 0, give points based on months of expenses covered
    const monthsOfExpenses = totalExpenses > 0 ? (totalIncome - totalExpenses) / totalExpenses : 0;
    const emergencyPoints = Math.min(Math.max(monthsOfExpenses * 3.33, 0), 10);
    score += emergencyPoints;

    factors.push({
      factor: 'Emergency Fund',
      value: `${monthsOfExpenses.toFixed(2)} months`,
      points: emergencyPoints.toFixed(2),
      maxPoints: 10,
      status: monthsOfExpenses >= 3 ? 'excellent' : monthsOfExpenses >= 1 ? 'good' : 'needs improvement'
    });

    // Determine overall status
    let overallStatus;
    let recommendation;

    if (score >= 80) {
      overallStatus = 'Excellent';
      recommendation = 'Great job! Keep up the excellent financial habits.';
    } else if (score >= 60) {
      overallStatus = 'Good';
      recommendation = 'You\'re doing well! Focus on improving savings rate and goal progress.';
    } else if (score >= 40) {
      overallStatus = 'Fair';
      recommendation = 'Room for improvement. Consider setting budgets and tracking expenses more consistently.';
    } else {
      overallStatus = 'Needs Improvement';
      recommendation = 'Focus on basic financial habits: track expenses daily, set budgets, and start saving.';
    }

    res.status(200).json({
      success: true,
      data: {
        score: score.toFixed(2),
        maxScore: 100,
        percentage: score.toFixed(2),
        status: overallStatus,
        recommendation,
        factors
      }
    });
  } catch (error) {
    console.error('Get financial health score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardSummary,
  getBurnRate,
  getSpendingTrends,
  getRecentTransactions,
  getFinancialHealthScore
};