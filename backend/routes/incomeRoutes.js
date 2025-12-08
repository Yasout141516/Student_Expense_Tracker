const express = require('express');
const router = express.Router();
const {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeStats
} = require('../controllers/incomeController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Statistics route (must be before /:id route)
router.get('/stats/summary', getIncomeStats);

// Main routes
router.route('/')
  .get(getIncomes)      // GET /api/incomes
  .post(createIncome);  // POST /api/incomes

router.route('/:id')
  .get(getIncome)       // GET /api/incomes/:id
  .put(updateIncome)    // PUT /api/incomes/:id
  .delete(deleteIncome);// DELETE /api/incomes/:id

module.exports = router;