const User = require('../models/userModel');
const Shelter = require('../models/shelterModel');
const Animal = require('../models/animalModel');
const Donation = require('../models/donationModel');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Отримання профілю користувача за ID
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Перевіряємо, чи користувач намагається отримати свої дані
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ заборонений' });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// Отримання статистики користувача
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    // Додамо логування для відлагодження
    console.log("Дані користувача для статистики:", {
      id: user._id,
      name: user.name,
      donationStats: user.donationStats || 'не існує'
    });
    
    let stats = {};
    
    // Для волонтера
    if (user.userType === 'volunteer') {
      // Кількість улюблених тварин
      stats.favorites = await Animal.countDocuments({ 
        '_id': { $in: user.favorites || [] } 
      });
      
      // Кількість усиновлень
      stats.adoptions = await Animal.countDocuments({ 
        adoptedBy: user._id 
      });
      
      // Додати пожертви з donationStats користувача
      stats.donations = user.donationStats?.totalAmount || 0;
      
      console.log(`Повертаємо суму пожертв для користувача ${user._id}: ${stats.donations} грн`);
    }
    
    // Для притулку - решта коду не змінюється
    if (user.userType === 'shelter') {
      const shelter = await Shelter.findOne({ user: user._id });
      
      if (shelter) {
        // Кількість тварин
        stats.animals = await Animal.countDocuments({ 
          shelter: shelter._id 
        });
        
        // Кількість прилаштованих тварин
        stats.adoptions = await Animal.countDocuments({ 
          shelter: shelter._id, 
          status: 'adopted' 
        });
        
        // Кількість запитів на усиновлення
        stats.requests = shelter.adoptionRequests ? shelter.adoptionRequests.length : 0;
      }
    }
    
    // Дебаг інформація
    console.log("Повертаємо статистику:", stats);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error("Помилка отримання статистики:", error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// Оновлення профілю користувача
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Перевіряємо авторизацію
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ заборонений' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    // Оновлюємо поля
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.address) user.address = req.body.address;
    
    // Якщо є файл аватару
    if (req.file) {
      // В реальному проекті тут була б логіка завантаження файлу
      // і отримання URL зображення
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    
    // Зберігаємо користувача
    await user.save();
    
    // Не повертаємо пароль
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// Зміна паролю
exports.changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    
    // Перевіряємо авторизацію
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ заборонений' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    // Перевіряємо поточний пароль
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Поточний пароль невірний' });
    }
    
    // Хешуємо новий пароль
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    
    res.status(200).json({ message: 'Пароль успішно змінено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// Видалення акаунту
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;
    
    // Перевіряємо авторизацію
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ заборонений' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    // Перевіряємо пароль перед видаленням
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Невірний пароль' });
    }
    
    // Видалення облікового запису
    await User.findByIdAndDelete(userId);
    
    // Очищення пов'язаних даних (залежить від вашої моделі даних)
    // Наприклад, видалення притулку, якщо користувач є представником притулку
    if (user.userType === 'shelter') {
      await Shelter.deleteMany({ user: userId });
    }
    
    res.status(200).json({ message: 'Обліковий запис успішно видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};