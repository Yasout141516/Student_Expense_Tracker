const express = require('express');
const router = express.Router();
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Specific routes FIRST (before /:id)
router.patch('/:id/progress', updateGoalProgress);  // PATCH /api/goals/:id/progress

// Main routes
router.route('/')
  .get(getGoals)      // GET /api/goals
  .post(createGoal);  // POST /api/goals

router.route('/:id')
  .get(getGoal)       // GET /api/goals/:id
  .put(updateGoal)    // PUT /api/goals/:id
  .delete(deleteGoal);// DELETE /api/goals/:id

module.exports = router;