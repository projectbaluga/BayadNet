const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authenticateToken = require('../middleware/auth');

// Public: Send a message
router.post('/public/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newMessage = new Message({
      name,
      email,
      message
    });

    const savedMessage = await newMessage.save();

    // Emit socket event if io is attached to req
    if (req.io) {
      req.io.emit('new-message', savedMessage);
    }

    res.status(201).json({ message: 'Message sent successfully', data: savedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected: Get all messages
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or staff
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
       return res.status(403).json({ message: 'Forbidden' });
    }

    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected: Mark message as read
router.patch('/messages/:id/read', authenticateToken, async (req, res) => {
  try {
     // Check if user is admin or staff
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
       return res.status(403).json({ message: 'Forbidden' });
    }

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status: 'Read' },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
