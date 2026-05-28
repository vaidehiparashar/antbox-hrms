const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// List attendance logs
router.get('/', attendanceController.getAttendance);

// List today's attendance table for all employees
router.get('/today', attendanceController.getTodayAttendance);

// Tap In/Out per employee ID (restricted to HR Managers/Super Admins)
router.post('/tapin/:employeeId', requireRole(['Super Admin', 'HR Manager']), attendanceController.tapInEmployee);
router.post('/tapout/:employeeId', requireRole(['Super Admin', 'HR Manager']), attendanceController.tapOutEmployee);

module.exports = router;
