const express = require('express');
const router = express.Router();
const { 
  createAdoptionRequest, 
  getVolunteerAdoptionRequests,
  cancelAdoptionRequest
} = require('../controllers/adoptionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Base adoption routes
router.route('/adoptions')
  .post(protect, authorize('volunteer'), createAdoptionRequest);

// Volunteer adoption routes
router.route('/volunteers/me/adoption-requests')
  .get(protect, authorize('volunteer'), getVolunteerAdoptionRequests);

// Cancel adoption request
router.route('/adoption-requests/:id')
  .delete(protect, authorize('volunteer'), cancelAdoptionRequest);

module.exports = router;