const express = require('express');
const router = express.Router();
const Router = require('../models/Router');
const mikrotikService = require('../services/mikrotik');
const { PERMISSIONS } = require('../config/permissions');

module.exports = (authenticateToken, authorize, checkPermission) => {
    // List all routers
    router.get('/', authenticateToken, checkPermission(PERMISSIONS.MANAGE_ROUTERS), async (req, res) => {
        try {
            const routers = await Router.find().select('-password');
            res.json(routers);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    // Create Router
    router.post('/', authenticateToken, checkPermission(PERMISSIONS.MANAGE_ROUTERS), async (req, res) => {
        try {
            const { name, host, port, username, password } = req.body;
            const router = new Router({ name, host, port, username, password });
            await router.save();
            const routerObj = router.toObject();
            delete routerObj.password;
            res.status(201).json(routerObj);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    });

    // Update Router
    router.put('/:id', authenticateToken, checkPermission(PERMISSIONS.MANAGE_ROUTERS), async (req, res) => {
        try {
            const router = await Router.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!router) return res.status(404).json({ message: 'Router not found' });
            const routerObj = router.toObject();
            delete routerObj.password;
            res.json(routerObj);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    });

    // Delete Router
    router.delete('/:id', authenticateToken, checkPermission(PERMISSIONS.MANAGE_ROUTERS), async (req, res) => {
        try {
            const router = await Router.findByIdAndDelete(req.params.id);
            if (!router) return res.status(404).json({ message: 'Router not found' });
            res.json({ message: 'Router deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    // Test Connection
    router.post('/:id/test', authenticateToken, checkPermission(PERMISSIONS.MANAGE_ROUTERS), async (req, res) => {
        try {
            const router = await Router.findById(req.params.id);
            if (!router) return res.status(404).json({ message: 'Router not found' });

            // Using the service
            const result = await mikrotikService.checkHealth(router);

            // Update last checked
            router.lastChecked = new Date();
            router.status = result.connected ? 'Online' : 'Offline';
            await router.save();

            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    return router;
};
