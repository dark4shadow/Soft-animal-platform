const AdoptionRequest = require('../models/adoptionRequestModel');
const Animal = require('../models/animalModel');
const User = require('../models/userModel');
const Shelter = require('../models/shelterModel');

/**
 * @desc    Create a new adoption request
 * @route   POST /api/adoptions
 * @access  Private (volunteer only)
 */
exports.createAdoptionRequest = async (req, res) => {
  try {
    const {
      animalId,
      name,
      phone,
      email,
      address,
      experience,
      reason,
      otherPets,
      housingType,
      hasChildren
    } = req.body;

    // Use req.user.id from auth middleware instead of volunteerId from request
    const userId = req.user.id;

    // Check if animal exists and is available
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Тварину не знайдено'
      });
    }

    // Create adoption request with the user ID from the auth middleware
    const adoptionRequest = await AdoptionRequest.create({
      user: userId,
      animal: animalId,
      shelter: animal.shelterId,
      contactPhone: phone,
      message: reason,
      name,
      email,
      address,
      experience,
      otherPets,
      housingType,
      hasChildren
    });

    // Update animal status
    animal.status = 'reserved';
    await animal.save();

    res.status(201).json({
      success: true,
      data: adoptionRequest,
      message: 'Запит на усиновлення успішно створено'
    });

  } catch (error) {
    console.error('Error creating adoption request:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка створення запиту на усиновлення',
      error: error.message
    });
  }
};

/**
 * @desc    Get all adoption requests for a volunteer
 * @route   GET /api/volunteers/me/adoption-requests
 * @access  Private (volunteer only)
 */
exports.getVolunteerAdoptionRequests = async (req, res) => {
  try {
    const adoptionRequests = await AdoptionRequest.find({ user: req.user.id })
      .populate('animal', 'name type image')
      .populate('shelter', 'name location');
    
    res.status(200).json({
      success: true,
      data: adoptionRequests
    });
  } catch (error) {
    console.error('Error getting adoption requests:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання запитів на усиновлення',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel an adoption request
 * @route   DELETE /api/adoption-requests/:id
 * @access  Private (volunteer who created the request)
 */
exports.cancelAdoptionRequest = async (req, res) => {
  try {
    const adoptionRequest = await AdoptionRequest.findById(req.params.id);
    
    if (!adoptionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Запит на усиновлення не знайдено'
      });
    }
    
    // Check if the user is the one who created the request
    if (adoptionRequest.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Ви не можете скасувати цей запит'
      });
    }
    
    // Check if the request is still pending
    if (adoptionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Запит уже ${adoptionRequest.status === 'approved' ? 'підтверджено' : 'відхилено'}`
      });
    }
    
    // Update animal status back to available
    const animal = await Animal.findById(adoptionRequest.animal);
    if (animal) {
      animal.status = 'available';
      await animal.save();
    }
    
    await AdoptionRequest.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Запит на усиновлення успішно скасовано'
    });
  } catch (error) {
    console.error('Error canceling adoption request:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка скасування запиту на усиновлення',
      error: error.message
    });
  }
};