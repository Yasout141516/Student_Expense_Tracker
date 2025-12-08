const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getBurnRate,
  getSpendingTrends,
  getRecentTransactions,
  getFinancialHealthScore
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Dashboard routes
router.get('/summary', getDashboardSummary);
router.get('/burn-rate', getBurnRate);
router.get('/trends', getSpendingTrends);
router.get('/recent-transactions', getRecentTransactions);
router.get('/health-score', getFinancialHealthScore);

module.exports = router;