const express = require('express');
const router = express.Router();
const leavesController = require('../controllers/leavesController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', leavesController.getAllLeaves);
router.put('/:id/approve', requireRole(['Super Admin', 'HR Manager']), leavesController.approveLeave);
router.put('/:id/reject', requireRole(['Super Admin', 'HR Manager']), leavesController.rejectLeave);

module.exports = router;
