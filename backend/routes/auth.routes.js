const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, authController.updateProfile);
router.post('/photo', auth, authController.uploadPhoto);

module.exports = router;
