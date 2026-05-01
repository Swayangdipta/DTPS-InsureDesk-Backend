const router = require('express').Router();
const ctrl   = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/overview',     ctrl.getOverview);
router.get('/by-category',  ctrl.getByCategory);
router.get('/by-broker',    ctrl.getByBroker);
router.get('/by-company',   ctrl.getByCompany);
router.get('/time-series',  ctrl.getTimeSeries);
router.get('/calendar',     ctrl.getCalendarData);

module.exports = router;
