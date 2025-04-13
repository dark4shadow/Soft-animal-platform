const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const animalIntakeController = require('../controllers/animalIntakeController');

// Маршрути для волонтерів
router.post('/intake-requests', protect, animalIntakeController.createIntakeRequest);
router.get('/volunteer/intake-requests', protect, animalIntakeController.getVolunteerIntakeRequests);
router.post('/intake-requests/:id/photos', protect, animalIntakeController.uploadIntakePhotos);
router.put('/intake-requests/:id/cancel', protect, animalIntakeController.cancelIntakeRequest);

// Маршрути для притулків
router.get('/shelters/:shelterId/intake-requests', protect, animalIntakeController.getShelterIntakeRequests);
router.put('/intake-requests/:id/status', protect, animalIntakeController.updateIntakeRequestStatus);

// Відкриті запити
router.get('/open-intake-requests', protect, animalIntakeController.getOpenIntakeRequests);

module.exports = router;