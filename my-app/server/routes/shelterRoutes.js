const express = require('express');
const router = express.Router();
const shelterController = require('../controllers/shelterController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Базові маршрути
router
  .route('/')
  .get(shelterController.getShelters)
  .post(protect, authorize('shelter', 'admin'), shelterController.createShelter);

router
  .route('/:id')
  .get(shelterController.getShelterById)
  .put(protect, authorize('shelter', 'admin'), shelterController.updateShelter)
  .delete(protect, authorize('shelter', 'admin'), shelterController.deleteShelter);

// Маршрути для тварин притулку
router.get('/:id/animals', shelterController.getShelterAnimals);

// Маршрути для відгуків притулку
router.get('/:id/reviews', shelterController.getShelterReviews);
router.post('/:id/reviews', protect, shelterController.addShelterReview);

module.exports = router;