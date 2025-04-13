const AnimalIntakeRequest = require('../models/animalIntakeRequestModel');
const User = require('../models/userModel');
const Shelter = require('../models/shelterModel');
const { uploadAnimalImages } = require('../middlewares/uploadMiddleware');
const mongoose = require('mongoose');

// Створення нового запиту на прийом тварини
exports.createIntakeRequest = async (req, res) => {
  try {
    // Перевіряємо, чи користувач є волонтером
    if (req.user.userType !== 'volunteer') {
      return res.status(403).json({
        success: false,
        message: 'Тільки волонтери можуть створювати запити на прийом тварин'
      });
    }

    // Додаємо ID волонтера
    req.body.volunteerId = req.user.id;
    
    // Створюємо запит
    const intakeRequest = await AnimalIntakeRequest.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Запит на прийом тварини успішно створено',
      data: intakeRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Не вдалося створити запит на прийом тварини',
      error: error.message
    });
  }
};

// Отримання всіх запитів волонтера
exports.getVolunteerIntakeRequests = async (req, res) => {
  try {
    const requests = await AnimalIntakeRequest.find({ volunteerId: req.user.id })
      .sort('-createdAt')
      .populate('shelterId', 'name location');
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати запити на прийом тварин',
      error: error.message
    });
  }
};

// Отримання всіх запитів для конкретного притулку
exports.getShelterIntakeRequests = async (req, res) => {
  try {
    const requests = await AnimalIntakeRequest.find({ 
      shelterId: req.params.shelterId,
      status: { $in: ['pending', 'approved'] } 
    })
      .sort('-createdAt')
      .populate('volunteerId', 'name email phone');
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати запити на прийом тварин для притулку',
      error: error.message
    });
  }
};

// Отримання всіх відкритих запитів (без вказаного притулку)
exports.getOpenIntakeRequests = async (req, res) => {
  try {
    const { location, type, urgency } = req.query;
    const query = { 
      shelterId: { $exists: false },
      status: 'pending'
    };
    
    if (location) query['foundDetails.location'] = location;
    if (type) query['animalInfo.type'] = type;
    if (urgency) query.urgency = urgency;
    
    const requests = await AnimalIntakeRequest.find(query)
      .sort('-createdAt')
      .populate('volunteerId', 'name email phone');
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати відкриті запити на прийом тварин',
      error: error.message
    });
  }
};

// Оновлення статусу запиту притулком
exports.updateIntakeRequestStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const request = await AnimalIntakeRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Запит не знайдено'
      });
    }
    
    // Перевіряємо права доступу
    const shelter = await Shelter.findById(request.shelterId);
    if (!shelter || shelter.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'У вас немає прав для оновлення цього запиту'
      });
    }
    
    request.status = status;
    if (comment) request.comment = comment;
    
    await request.save();
    
    res.status(200).json({
      success: true,
      message: `Статус запиту успішно змінено на ${status}`,
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Не вдалося оновити статус запиту',
      error: error.message
    });
  }
};

// Скасування запиту волонтером
exports.cancelIntakeRequest = async (req, res) => {
  try {
    const request = await AnimalIntakeRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Запит не знайдено'
      });
    }
    
    // Перевіряємо права доступу
    if (request.volunteerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'У вас немає прав для скасування цього запиту'
      });
    }
    
    // Перевіряємо, чи запит не вже оброблений
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Неможливо скасувати запит зі статусом "${request.status}"`
      });
    }
    
    request.status = 'cancelled';
    await request.save();
    
    res.status(200).json({
      success: true,
      message: 'Запит успішно скасовано',
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Не вдалося скасувати запит',
      error: error.message
    });
  }
};

// Завантаження фото для запиту
exports.uploadIntakePhotos = (req, res) => {
  uploadAnimalImages(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `Помилка завантаження зображень: ${err.message}`
      });
    }
    
    try {
      const request = await AnimalIntakeRequest.findById(req.params.id);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Запит не знайдено'
        });
      }
      
      // Перевіряємо права доступу
      if (request.volunteerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'У вас немає прав для редагування цього запиту'
        });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Немає файлів для завантаження'
        });
      }
      
      const photoUrls = req.files.map(file => `/uploads/animals/${file.filename}`);
      
      request.photos = [...(request.photos || []), ...photoUrls];
      await request.save();
      
      res.status(200).json({
        success: true,
        message: 'Фото успішно завантажені',
        data: {
          photos: request.photos
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Не вдалося завантажити фото',
        error: error.message
      });
    }
  });
};