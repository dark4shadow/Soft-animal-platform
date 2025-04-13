const Animal = require('../models/animalModel');
const Shelter = require('../models/shelterModel');
const { uploadAnimalImage } = require('../middlewares/uploadMiddleware');

// Отримати всіх тварин з фільтрацією
exports.getAnimals = async (req, res) => {
  try {
    const { type, status, shelterId, searchQuery, location, limit = 10, page = 1 } = req.query;
    const query = {};

    // Застосовуємо фільтри
    if (type && type !== 'all') {
      query.type = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (shelterId) {
      query.shelterId = shelterId;
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

    const animals = await Animal.find(query)
      .populate('shelterInfo', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    const total = await Animal.countDocuments(query);

    res.status(200).json({
      success: true,
      count: animals.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: animals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати дані про тварин',
      error: error.message
    });
  }
};

// Отримати тварину за ID
exports.getAnimalById = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id)
      .populate('shelterInfo', 'name location');

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Тварину не знайдено'
      });
    }

    // Збільшуємо лічильник переглядів
    animal.viewsCount += 1;
    await animal.save();

    res.status(200).json({
      success: true,
      data: animal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати дані про тварину',
      error: error.message
    });
  }
};

// Створити нову тварину
exports.createAnimal = async (req, res) => {
  uploadAnimalImage(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `Помилка завантаження зображення: ${err.message}`
      });
    }
    
    try {
      let imageUrl = null;
      
      if (req.file) {
        imageUrl = `/uploads/animals/${req.file.filename}`;
      }
      
      // Debug: Log the received data
      console.log("Request body:", req.body);
      
      // Explicitly check for the type field
      if (!req.body.type) {
        console.warn("Type field missing from request body");
        return res.status(400).json({
          success: false,
          message: "Тип тварини обов'язковий"
        });
      }
      
      // Знаходимо притулок
      const shelter = await Shelter.findById(req.body.shelterId);
      if (!shelter) {
        return res.status(404).json({
          success: false,
          message: 'Притулок не знайдено'
        });
      }

      // Create animal data object explicitly to ensure all fields are set
      const animalData = {
        name: req.body.name,
        type: req.body.type,
        gender: req.body.gender,
        age: req.body.age,
        breed: req.body.breed || '',
        description: req.body.description,
        status: req.body.status || 'available',
        size: req.body.size || 'medium',
        health: req.body.healthStatus || '',
        shelterId: req.body.shelterId,
        image: imageUrl,
        location: shelter.location
      };
      
      console.log('Final animal data to save:', animalData);

      // Створення запису про тварину
      const animal = await Animal.create(animalData);
      
      // Оновлюємо лічильник тварин у притулку
      shelter.animalsCount = (shelter.animalsCount || 0) + 1;
      await shelter.save();
      
      res.status(201).json({
        success: true,
        data: animal
      });
    } catch (error) {
      console.error('Error creating animal:', error);
      res.status(400).json({
        success: false,
        message: 'Не вдалося створити картку тварини',
        error: error.message
      });
    }
  });
};

// Оновити існуючу тварину
exports.updateAnimal = async (req, res) => {
  uploadAnimalImage(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `Помилка завантаження зображення: ${err.message}`
      });
    }
    
    try {
      const animal = await Animal.findById(req.params.id);
      
      if (!animal) {
        return res.status(404).json({
          success: false,
          message: 'Тварину не знайдено'
        });
      }
      
      // Знаходимо притулок
      const shelter = await Shelter.findById(animal.shelterId);
      
      // Перевірка прав доступу
      if (req.user.userType !== 'admin' && 
         (req.user.userType !== 'shelter' || req.user.shelterId.toString() !== shelter._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'У вас немає прав для редагування цієї тварини'
        });
      }
      
      // Підготовка даних для оновлення
      const updateData = {...req.body};
      
      // Якщо завантажено нове зображення
      if (req.file) {
        // Видалення старого зображення (якщо це не зображення за замовчуванням)
        if (animal.image && animal.image.startsWith('/uploads/animals/')) {
          const oldImagePath = path.join(__dirname, '..', 'public', animal.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        // Оновлення шляху до зображення
        updateData.image = `/uploads/animals/${req.file.filename}`;
      }
      
      // Оновлення даних тварини
      const updatedAnimal = await Animal.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('shelterInfo');
      
      res.status(200).json({
        success: true,
        data: updatedAnimal
      });
      
    } catch (error) {
      console.error('Error updating animal:', error);
      res.status(400).json({
        success: false,
        message: 'Не вдалося оновити дані про тварину',
        error: error.message
      });
    }
  });
};

// Видалити тварину
exports.deleteAnimal = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Тварину не знайдено'
      });
    }

    // Перевірка прав доступу
    const shelter = await Shelter.findById(animal.shelterId);
    if (shelter.ownerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'У вас немає прав для видалення цієї тварини'
      });
    }

    await animal.remove();

    // Зменшуємо лічильник тварин у притулку
    shelter.animalsCount -= 1;
    await shelter.save();

    res.status(200).json({
      success: true,
      message: 'Тварину успішно видалено'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося видалити тварину',
      error: error.message
    });
  }
};

// Отримати тварин конкретного притулку
exports.getAnimalsByShelter = async (req, res) => {
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
      message: 'Не вдалося отримати дані про тварин притулку',
      error: error.message
    });
  }
};