const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// These middlewares are defined in index.js, but for clean separation
// usually they are in a middleware file. Since they are in index.js,
// I will need to pass them or export them from index.js.
// However, the easiest way for this specific codebase is to define the routes in index.js
// or export the middlewares.
// Let's check if index.js exports them. It doesn't.
// I'll redefine them or move them to a separate file.
// Moving them to a separate file is better.

module.exports = (authenticateToken, authorize) => {
  router.get('/', authenticateToken, authorize('admin'), userController.getUsers);
  router.post('/', authenticateToken, authorize('admin'), userController.createUser);
  router.put('/:id', authenticateToken, authorize('admin'), userController.updateUser);
  router.delete('/:id', authenticateToken, authorize('admin'), userController.deleteUser);
  return router;
};
