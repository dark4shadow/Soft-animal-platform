const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Публічні маршрути
router.get('/stats', donationController.getDonationStats);
router.post('/', donationController.createDonation);
router.get('/:id', donationController.getDonation); // Новий маршрут для перевірки статусу
router.put('/:id/status', donationController.updateDonationStatus);

// Приватні маршрути
router.get('/', protect, authorize('admin'), donationController.getDonations);
router.get('/user/:userId', protect, donationController.getUserDonations);

module.exports = router;