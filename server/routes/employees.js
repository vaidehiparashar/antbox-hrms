const express = require('express');
const router = express.Router();
const employeesController = require('../controllers/employeesController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadPhoto } = require('../utils/cloudinary');

// All employee routes require authentication
router.use(authenticateToken);

// Get all employees (only HR/Admin or Dept Head can see all, Employee can see directory)
router.get('/', employeesController.getAllEmployees);

// Get specific employee
router.get('/:id', employeesController.getEmployeeById);

// Create employee (HR/Admin only) - uses cloudinary multer for photo
router.post('/', requireRole(['Super Admin', 'HR Manager']), uploadPhoto.single('photo'), employeesController.createEmployee);

// Update employee (HR/Admin only)
router.put('/:id', requireRole(['Super Admin', 'HR Manager']), employeesController.updateEmployee);

// Terminate / Soft delete employee (HR/Admin only)
router.delete('/:id', requireRole(['Super Admin', 'HR Manager']), employeesController.deleteEmployee);

module.exports = router;
