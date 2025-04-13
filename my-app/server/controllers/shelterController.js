const mongoose = require('mongoose');
const Shelter = require('../models/shelterModel');
const Animal = require('../models/animalModel');
const Review = require('../models/reviewModel');
const User = require('../models/userModel'); // Додано для отримання даних користувача
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Конфігурація multer для завантаження файлів
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'shelters');
    
    // Створюємо директорію, якщо вона не існує
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `shelter-${req.params.id}-${Date.now()}.${ext}`);
  }
});

// Фільтр для типів файлів (тільки зображення)
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Будь ласка, завантажуйте тільки зображення!'), false);
  }
};

// Отримати всі притулки з фільтрацією
exports.getShelters = async (req, res) => {
  try {
    const { type, location, searchQuery, limit = 10, page = 1 } = req.query;
    const query = {};

    // Застосовуємо фільтри
    if (type && type !== 'all') {
      query.type = type;
    }

    if (location && location !== 'all') {
      query.location = location;
    }

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const shelters = await Shelter.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    const total = await Shelter.countDocuments(query);

    res.status(200).json({
      success: true,
      count: shelters.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: shelters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати дані про притулки',
      error: error.message
    });
  }
};

// Отримати один притулок за ID
exports.getShelterById = async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Притулок не знайдено'
      });
    }

    res.status(200).json({
      success: true,
      data: shelter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати дані про притулок',
      error: error.message
    });
  }
};

// Створити новий притулок
exports.createShelter = async (req, res) => {
  try {
    const shelter = await Shelter.create({
      ...req.body,
      ownerId: req.user.id // ID користувача з токена JWT
    });

    res.status(201).json({
      success: true,
      data: shelter
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Не вдалося створити притулок',
      error: error.message
    });
  }
};

// Оновити дані притулку
exports.updateShelter = async (req, res) => {
  // Перевіряємо, чи використовуємо multer middleware для обробки файлів
  const uploadShelterImage = multer({
    storage: multerStorage,
    fileFilter: multerFilter
  }).single('image');

  uploadShelterImage(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `Помилка завантаження зображення: ${err.message}`
      });
    }
    
    console.log('Отримані дані для оновлення притулку:', req.body);
    console.log('Завантажений файл:', req.file);
    
    try {
      const shelter = await Shelter.findById(req.params.id);
  
      if (!shelter) {
        return res.status(404).json({
          success: false,
          message: 'Притулок не знайдено'
        });
      }
  
      // Перевірка прав доступу
      if (shelter.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'У вас немає прав для редагування цього притулку'
        });
      }

      // Обробка зображення, якщо воно є
      let imageUrl = shelter.image;
      if (req.file) {
        // Якщо є старе зображення, видаляємо його
        if (shelter.image && shelter.image.startsWith('/uploads/')) {
          const oldImagePath = path.join(__dirname, '..', 'public', shelter.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        imageUrl = `/uploads/shelters/${req.file.filename}`;
      }

      // Підготовка об'єкта для оновлення
      const updateData = { ...req.body };
      
      // Обробка соціальних мереж, які приходять у форматі socialMedia[facebook]
      const socialMedia = {};
      for (const key in req.body) {
        if (key.startsWith('socialMedia[')) {
          const socialKey = key.match(/\[(.*?)\]/)[1];
          socialMedia[socialKey] = req.body[key];
          delete updateData[key]; // Видаляємо, щоб потім додати як об'єкт
        }
      }
      
      // Додаємо оброблені дані
      if (Object.keys(socialMedia).length > 0) {
        updateData.socialMedia = socialMedia;
      }
      
      // Додаємо URL зображення, якщо воно було завантажено
      if (req.file) {
        updateData.image = imageUrl;
      }
      
      // Якщо needsHelp подається як JSON рядок, перетворюємо його
      if (updateData.needsHelp && typeof updateData.needsHelp === 'string' && updateData.needsHelp.startsWith('[')) {
        try {
          updateData.needsHelp = JSON.parse(updateData.needsHelp);
        } catch (e) {
          console.error('Error parsing needsHelp JSON:', e);
        }
      }
      
      // Оновлюємо дані притулку
      const updatedShelter = await Shelter.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
  
      res.status(200).json({
        success: true,
        data: updatedShelter
      });
    } catch (error) {
      console.error('Error updating shelter:', error);
      res.status(500).json({
        success: false,
        message: 'Не вдалося оновити дані про притулок',
        error: error.message
      });
    }
  });
};

// Видалити притулок
exports.deleteShelter = async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Притулок не знайдено'
      });
    }

    // Перевірка, чи є користувач власником притулку
    if (shelter.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'У вас немає прав для видалення цього притулку'
      });
    }

    // Видаляємо всіх тварин притулку
    await Animal.deleteMany({ shelterId: req.params.id });
    
    // Видаляємо сам притулок
    await shelter.remove();

    res.status(200).json({
      success: true,
      message: 'Притулок успішно видалено'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося видалити притулок',
      error: error.message
    });
  }
};

// Отримати тварин притулку
exports.getShelterAnimals = async (req, res) => {
  try {
    const animals = await Animal.find({ shelterId: req.params.id });
    
    res.status(200).json({
      success: true,
      count: animals.length,
      data: animals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати тварин притулку',
      error: error.message
    });
  }
};

// Отримати відгуки притулку
exports.getShelterReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ shelterId: req.params.id })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати відгуки притулку',
      error: error.message
    });
  }
};

// Додати відгук для притулку
exports.addShelterReview = async (req, res) => {
  try {
    // Додаємо shelterId з URL параметрів та userId з JWT токена
    req.body.shelterId = req.params.id;
    req.body.userId = req.user.id;
    
    // Додаємо ім'я автора автоматично з даних користувача
    const user = await User.findById(req.user.id);
    req.body.author = user.name || user.email.split('@')[0]; // Використовуємо ім'я або першу частину email
    
    // Перевіряємо, чи існує притулок
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Притулок не знайдено'
      });
    }
    
    // Перевіряємо, чи користувач вже залишав відгук
    const existingReview = await Review.findOne({
      shelterId: req.params.id,
      userId: req.user.id
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Ви вже залишили відгук для цього притулку'
      });
    }
    
    // Створюємо відгук
    const review = await Review.create(req.body);
    
    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Помилка при додаванні відгуку',
      error: error.message
    });
  }
};