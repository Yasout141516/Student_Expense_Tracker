const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Statistics route (must be before /:id route)
router.get('/stats/summary', getExpenseStats);

// Main routes
router.route('/')
  .get(getExpenses)      // GET /api/expenses
  .post(createExpense);  // POST /api/expenses

router.route('/:id')
  .get(getExpense)       // GET /api/expenses/:id
  .put(updateExpense)    // PUT /api/expenses/:id
  .delete(deleteExpense);// DELETE /api/expenses/:id

module.exports = router;