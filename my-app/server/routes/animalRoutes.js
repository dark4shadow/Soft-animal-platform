const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Базові маршрути
router
  .route('/')
  .get(animalController.getAnimals)
  .post(protect, authorize('shelter', 'admin'), animalController.createAnimal);

router
  .route('/:id')
  .get(animalController.getAnimalById)
  .put(protect, authorize('shelter', 'admin'), animalController.updateAnimal)
  .delete(protect, authorize('shelter', 'admin'), animalController.deleteAnimal);

module.exports = router;