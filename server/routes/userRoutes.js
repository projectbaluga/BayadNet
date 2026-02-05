const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');

router.get('/', authenticateToken, authorize('admin'), userController.getUsers);
router.post('/', authenticateToken, authorize('admin'), userController.createUser);
router.put('/:id', authenticateToken, authorize('admin'), userController.updateUser);
router.delete('/:id', authenticateToken, authorize('admin'), userController.deleteUser);

module.exports = router;
