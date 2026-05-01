const router = require('express').Router();
const ctrl   = require('../controllers/export.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// All accept the same query params as GET /api/policies for consistent filtering
router.get('/excel', ctrl.exportExcel);
router.get('/csv',   ctrl.exportCSV);
router.get('/pdf',   ctrl.exportPDF);

module.exports = router;
