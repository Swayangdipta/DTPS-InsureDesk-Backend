const router   = require('express').Router();
const ctrl     = require('../controllers/company.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const v        = require('../validations/master.validation');

router.use(protect);

// GET supports ?brokerHouse=<id> for cascading dropdown
router.get ('/',    ctrl.getCompanies);
router.get ('/:id', ctrl.getCompanyById);

// Write operations — admin only
router.post  ('/',    authorize('admin'), validate(v.createCompany), ctrl.createCompany);
router.put   ('/:id', authorize('admin'), validate(v.updateCompany), ctrl.updateCompany);
router.delete('/:id', authorize('admin'), ctrl.deleteCompany);

module.exports = router;
