const express = require('express');
const router = express.Router();
const { getAllDepartments } = require('../controllers/departmentsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getAllDepartments);

module.exports = router;
