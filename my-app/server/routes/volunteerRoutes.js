const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const volunteerController = require('../controllers/volunteerController');

// Маршрути для улюблених тварин
router.get('/me/favorites', protect, volunteerController.getFavorites);
router.post('/me/favorites/:animalId', protect, volunteerController.addFavorite);
router.delete('/me/favorites/:animalId', protect, volunteerController.removeFavorite);

// Маршрути для запитів на всиновлення
router.get('/me/adoption-requests', protect, volunteerController.getAdoptionRequests);
router.delete('/adoption-requests/:requestId', protect, volunteerController.cancelAdoptionRequest);

// Маршрути для всиновлених тварин
router.get('/me/adopted-animals', protect, volunteerController.getAdoptedAnimals);

module.exports = router;