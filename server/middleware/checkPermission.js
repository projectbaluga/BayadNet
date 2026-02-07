const User = require('../models/User');

const checkPermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
          return res.status(403).json({ message: 'User not found' });
      }

      // If user is admin, they might bypass checks, but let's respect the permission system
      // The User model's hasPermission method handles the merging of defaults and overrides.
      // Admin defaults are all true.

      if (!user.hasPermission(permission)) {
        return res.status(403).json({ message: `Forbidden: You do not have the '${permission}' permission.` });
      }

      // Update req.user with the fresh DB object which includes permissions
      req.user = user;
      next();
    } catch (err) {
      console.error('Permission check error:', err);
      res.status(500).json({ message: 'Internal Server Error during permission check' });
    }
  };
};

module.exports = checkPermission;
