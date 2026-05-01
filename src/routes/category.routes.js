const router   = require('express').Router();
const ctrl     = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const v        = require('../validations/master.validation');

router.use(protect);

router.get ('/',    ctrl.getCategories);
router.get ('/:id', ctrl.getCategoryById);

// Write operations — admin only
router.post  ('/',    authorize('admin'), validate(v.createCategory), ctrl.createCategory);
router.put   ('/:id', authorize('admin'), validate(v.updateCategory), ctrl.updateCategory);
router.delete('/:id', authorize('admin'), ctrl.deleteCategory);

module.exports = router;
