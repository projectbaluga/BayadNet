const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { PERMISSIONS } = require('../config/permissions');

module.exports = (authenticateToken, authorize, checkPermission) => {
  router.get('/', authenticateToken, checkPermission(PERMISSIONS.MANAGE_USERS), userController.getUsers);
  router.post('/', authenticateToken, checkPermission(PERMISSIONS.MANAGE_USERS), userController.createUser);
  router.put('/:id', authenticateToken, checkPermission(PERMISSIONS.MANAGE_USERS), userController.updateUser);
  router.delete('/:id', authenticateToken, checkPermission(PERMISSIONS.MANAGE_USERS), userController.deleteUser);
  return router;
};
