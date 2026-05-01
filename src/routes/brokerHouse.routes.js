const router   = require('express').Router();
const ctrl     = require('../controllers/brokerHouse.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const v        = require('../validations/master.validation');

router.use(protect);

router.get ('/',    ctrl.getBrokerHouses);
router.get ('/:id', ctrl.getBrokerHouseById);

// Write operations — admin only
router.post  ('/',    authorize('admin'), validate(v.createBrokerHouse), ctrl.createBrokerHouse);
router.put   ('/:id', authorize('admin'), validate(v.updateBrokerHouse), ctrl.updateBrokerHouse);
router.delete('/:id', authorize('admin'), ctrl.deleteBrokerHouse);

module.exports = router;
