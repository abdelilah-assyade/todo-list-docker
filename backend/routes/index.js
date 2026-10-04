const express = require('express');
const taskRoutes = require('./tasks');

const router = express.Router();

// Docker healthchecks hit this. It answers 200 as soon as the app can serve.
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', driver: require('../config').dbDriver } });
});

router.use('/tasks', taskRoutes);

module.exports = router;