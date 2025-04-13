const User = require('../models/userModel');
const Animal = require('../models/animalModel');
const AdoptionRequest = require('../models/adoptionRequestModel');
const mongoose = require('mongoose');

/**
 * @desc    Отримати список улюблених тварин волонтера
 * @route   GET /api/users/me/favorites
 * @access  Private (тільки для волонтерів)
 */
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    // Перевіряємо чи є користувач волонтером
    if (user.userType !== 'volunteer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Доступ заборонено. Тільки волонтери мають доступ до цього ресурсу' 
      });
    }

    // Отримуємо дані про улюблені тварини
    const favorites = await Animal.find({
      _id: { $in: user.favorites || [] }
    }).populate('shelter', 'name location');

    res.status(200).json(favorites);
  } catch (error) {
    console.error('Помилка отримання улюблених тварин:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Помилка сервера при отриманні улюблених тварин' 
    });
  }
};

/**
 * @desc    Додати тварину до улюблених
 * @route   POST /api/users/me/favorites/:animalId
 * @access  Private (тільки для волонтерів)
 */
exports.addFavorite = async (req, res) => {
  try {
    const { animalId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(animalId)) {
      return res.status(400).json({ success: false, message: 'Невірний ID тварини' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    // Перевіряємо чи є користувач волонтером
    if (user.userType !== 'volunteer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Доступ заборонено. Тільки волонтери можуть додавати тварин до улюблених' 
      });
    }

    // Перевіряємо чи існує тварина
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Тварину не знайдено' });
    }

    // Перевіряємо чи не додана вже тварина до улюблених
    if (user.favorites && user.favorites.includes(animalId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ця тварина вже додана до улюблених' 
      });
    }

    // Додаємо тварину до улюблених
    if (!user.favorites) {
      user.favorites = [];
    }
    user.favorites.push(animalId);
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Тварину успішно додано до улюблених',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Помилка додавання тварини до улюблених:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Помилка сервера при додаванні тварини до улюблених' 
    });
  }
};

/**
 * @desc    Видалити тварину з улюблених
 * @route   DELETE /api/users/me/favorites/:animalId
 * @access  Private (тільки для волонтерів)
 */
exports.removeFavorite = async (req, res) => {
  try {
    const { animalId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(animalId)) {
      return res.status(400).json({ success: false, message: 'Невірний ID тварини' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    // Перевіряємо чи є користувач волонтером
    if (user.userType !== 'volunteer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Доступ заборонено. Тільки волонтери можуть видаляти тварин з улюблених' 
      });
    }

    // Видаляємо тварину з улюблених
    if (!user.favorites || !user.favorites.includes(animalId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ця тварина не знаходиться у списку улюблених' 
      });
    }

    user.favorites = user.favorites.filter(id => id.toString() !== animalId);
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Тварину успішно видалено з улюблених',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Помилка видалення тварини з улюблених:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Помилка сервера при видаленні тварини з улюблених' 
    });
  }
};

/**
 * @desc    Отримати запити на всиновлення волонтера
 * @route   GET /api/users/me/adoption-requests
 * @access  Private (тільки для волонтерів)
 */
exports.getAdoptionRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    // Перевіряємо чи є користувач волонтером
    if (user.userType !== 'volunteer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Доступ заборонено. Тільки волонтери мають доступ до цього ресурсу' 
      });
    }

    // Отримуємо запити на всиновлення
    const requests = await AdoptionRequest.find({ 
      user: req.user.id 
    })
    .populate('animal', 'name photos species gender age')
    .populate('shelter', 'name location');

    res.status(200).json(requests);
  } catch (error) {
    console.error('Помилка отримання запитів на всиновлення:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Помилка сервера при отриманні запитів на всиновлення' 
    });
  }
};

/**
 * @desc    Скасувати запит на всиновлення
 * @route   DELETE /api/adoption-requests/:requestId
 * @access  Private (тільки волонтер, який створив запит)
 */
exports.cancelAdoptionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: 'Невірний ID запиту' });
    }

    const request = await AdoptionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Запит не знайдено' });
    }

    // Перевіряємо чи користувач є автором запиту
    if (request.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Доступ заборонено. Ви не можете скасувати цей запит' 
      });
    }

    // Перевіряємо статус запиту
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Неможливо скасувати запит зі статусом "${request.status}"` 
      });
    }

    // Видаляємо запит
    await AdoptionRequest.findByIdAndDelete(requestId);

    res.status(200).json({ 
      success: true, 
      message: 'Запит на всиновлення успішно скасовано'
    });
  } catch (error) {
    console.error('Помилка скасування запиту на всиновлення:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Помилка сервера при скасуванні запиту на всиновлення' 
    });
  }
};

/**
 * @desc    Отримати всиновлені тварини волонтера
 * @route   GET /api/users/me/adopted-animals
 * @access  Private (тільки для волонтерів)
 */
exports.getAdoptedAnimals = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    // Перевіряємо чи є користувач волонтером
    if (user.userType !== 'volunteer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Доступ заборонено. Тільки волонтери мають доступ до цього ресурсу' 
      });
    }

    // Отримуємо всиновлені тварини
    const adoptedAnimals = await Animal.find({
      adoptedBy: req.user.id,
      status: 'adopted'
    }).populate('shelter', 'name location');

    res.status(200).json(adoptedAnimals);
  } catch (error) {
    console.error('Помилка отримання всиновлених тварин:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Помилка сервера при отриманні всиновлених тварин' 
    });
  }
};