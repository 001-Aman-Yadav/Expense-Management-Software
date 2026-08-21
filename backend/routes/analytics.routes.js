const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);

router.get('/dashboard', analyticsController.getDashboardStats);

module.exports = router;
