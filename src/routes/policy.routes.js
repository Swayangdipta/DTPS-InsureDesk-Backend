const router   = require('express').Router();
const ctrl     = require('../controllers/policy.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const v        = require('../validations/policy.validation');

// All policy routes require authentication
router.use(protect);

// Special routes — must come BEFORE /:id to avoid conflicts
router.get ('/renewals',     ctrl.getRenewals);
router.post('/bulk-import', ctrl.bulkImport);

// Standard CRUD
router.get ('/',     ctrl.getPolicies);
router.post('/',     validate(v.createPolicy), ctrl.createPolicy);

router.get ('/:id',  ctrl.getPolicyById);
router.put ('/:id',  validate(v.updatePolicy), ctrl.updatePolicy);
router.delete('/:id', ctrl.deletePolicy);

// Bookmark toggle
router.put('/:id/bookmark', ctrl.toggleBookmark);

module.exports = router;
