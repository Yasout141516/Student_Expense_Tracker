const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');

// All routes require authentication
router.use(protect);

// Budget routes
router.route('/')
  .get(getBudgets)
  .post(createBudget);

router.route('/:id')
  .get(getBudget)
  .put(updateBudget)
  .delete(deleteBudget);

module.exports = router;