const express = require('express');
const router = express.Router();
const Router = require('../models/Router');
const mikrotikService = require('../services/mikrotik');

module.exports = (authenticateToken, authorize) => {
    // List all routers
    router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
        try {
            const routers = await Router.find();
            // Check status for each router? Maybe on demand or in background.
            // For now, return stored status.
            res.json(routers);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    // Create Router
    router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
        try {
            const { name, host, port, username, password } = req.body;
            const router = new Router({ name, host, port, username, password });
            await router.save();
            res.status(201).json(router);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    });

    // Update Router
    router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
        try {
            const router = await Router.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!router) return res.status(404).json({ message: 'Router not found' });
            res.json(router);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    });

    // Delete Router
    router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
        try {
            const router = await Router.findByIdAndDelete(req.params.id);
            if (!router) return res.status(404).json({ message: 'Router not found' });
            res.json({ message: 'Router deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    // Test Connection
    router.post('/:id/test', authenticateToken, authorize('admin'), async (req, res) => {
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
