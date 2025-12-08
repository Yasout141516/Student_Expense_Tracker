const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Category routes
router.route('/')
  .get(getCategories)      // GET /api/categories
  .post(createCategory);   // POST /api/categories

router.route('/:id')
  .get(getCategory)        // GET /api/categories/:id
  .put(updateCategory)     // PUT /api/categories/:id
  .delete(deleteCategory); // DELETE /api/categories/:id

module.exports = router;