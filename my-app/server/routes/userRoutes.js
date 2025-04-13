const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadAvatar } = require('../middlewares/uploadMiddleware');

// Отримання інформації про користувача
router.get('/:id', protect, userController.getUserById);

// Отримання статистики користувача
router.get('/:id/stats', protect, userController.getUserStats);

// Оновлення профілю користувача
router.put('/:id', protect, uploadAvatar, userController.updateUser);

// Зміна паролю
router.put('/:id/password', protect, userController.changePassword);

// Видалення акаунту
router.delete('/:id', protect, userController.deleteAccount);

module.exports = router;