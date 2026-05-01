const router = require('express').Router();
const ctrl   = require('../controllers/activity.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

// Admin only — activity logs are sensitive audit data
router.get('/', authorize('admin'), ctrl.getActivityLogs);

module.exports = router;
