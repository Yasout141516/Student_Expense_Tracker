const express = require('express');
const router = express.Router();
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getCurrentBudgetStatus
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Special routes (must be before /:id route)
router.get('/current/status', getCurrentBudgetStatus);

// Main routes
router.route('/')
  .get(getBudgets)      // GET /api/budgets
  .post(createBudget);  // POST /api/budgets

router.route('/:id')
  .get(getBudget)       // GET /api/budgets/:id
  .put(updateBudget)    // PUT /api/budgets/:id
  .delete(deleteBudget);// DELETE /api/budgets/:id

module.exports = router;