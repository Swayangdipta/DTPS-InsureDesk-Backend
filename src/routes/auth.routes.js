const router   = require('express').Router();
const ctrl     = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const v        = require('../validations/auth.validation');

// Public
router.post('/login',    validate(v.login),    ctrl.login);

// Admin only — lock this down in production
router.post('/register', validate(v.register), ctrl.register);

// Protected
router.get ('/me',              protect, ctrl.getMe);
router.put ('/change-password', protect, validate(v.changePassword), ctrl.changePassword);

module.exports = router;
