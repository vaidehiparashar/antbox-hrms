const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// Generate payslip for a single employee (restricted to HR Managers/Super Admins)
router.post('/generate/:employeeId', requireRole(['Super Admin', 'HR Manager']), payrollController.generateSinglePayslip);

// Run payroll for all active employees (restricted to HR Managers/Super Admins)
router.post('/run-all', requireRole(['Super Admin', 'HR Manager']), payrollController.runPayrollForAll);

// Get payroll history for a single employee
router.get('/:employeeId', payrollController.getEmployeePayrollHistory);

module.exports = router;
