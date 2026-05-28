const express = require('express');
const router = express.Router();
const mailsController = require('../controllers/mailsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', mailsController.getAllMails);
router.put('/:id/accept', requireRole(['Super Admin', 'HR Manager']), mailsController.acceptMail);
router.put('/:id/reject', requireRole(['Super Admin', 'HR Manager']), mailsController.rejectMail);

module.exports = router;
