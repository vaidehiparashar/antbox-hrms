const express = require('express');
const router = express.Router();
const internsController = require('../controllers/internsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', internsController.getAllInterns);
router.post('/', requireRole(['Super Admin', 'HR Manager']), internsController.createIntern);
router.delete('/:id', requireRole(['Super Admin', 'HR Manager']), internsController.deleteIntern);
router.put('/:id/convert', requireRole(['Super Admin', 'HR Manager']), internsController.convertInternToEmployee);

module.exports = router;
