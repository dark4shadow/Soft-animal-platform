const User = require('../models/userModel');
const Shelter = require('../models/shelterModel');
const Animal = require('../models/animalModel');
const AdoptionRequest = require('../models/adoptionRequestModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Генерація JWT токену
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Реєстрація користувача
exports.register = async (req, res) => {
  try {
    const { name, email, password, userType, phone } = req.body;

    // Перевіряємо, чи користувач уже існує
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Користувач з такою електронною поштою вже існує'
      });
    }

    // Створити дані користувача
    const userData = { name, email, password, userType, phone };
    
    // Якщо реєструємо користувача типу "shelter"
    if (userType === 'shelter') {
      try {
        // 1. Спочатку створюємо користувача (без shelterId)
        const user = await User.create({
          name,
          email,
          password,
          userType,
          phone,
          address: req.body.address || 'Буде уточнено пізніше'
        });
        
        // 2. Створюємо притулок з ID користувача
        const newShelter = await Shelter.create({
          name: name + ' shelter',
          type: 'mixed',
          address: req.body.address || 'Буде уточнено пізніше',
          location: req.body.location || 'Буде уточнено',
          ownerId: user._id
        });
        
        // 3. Оновлюємо користувача, додавши ID притулку
        await User.findByIdAndUpdate(user._id, { shelterId: newShelter._id });
        
        // 4. Генеруємо токен і відправляємо відповідь
        const token = generateToken(user._id);
        res.status(201).json({
          success: true,
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            userType: user.userType,
            shelterId: newShelter._id
          }
        });
      } catch (error) {
        // Якщо помилка - видаляємо частково створені об'єкти
        console.error("Помилка при створенні притулку:", error);
        res.status(400).json({
          success: false,
          message: 'Помилка при створенні притулку: ' + error.message
        });
      }
    } else {
      // Для інших типів користувачів - стандартний процес
      const user = await User.create(userData);
      const token = generateToken(user._id);
      
      res.status(201).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType
        }
      });
    }
  } catch (error) {
    console.warn('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Вхід користувача
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Перевірка наявності email та пароля
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Будь ласка, введіть email та пароль'
      });
    }

    // Пошук користувача та завантаження пароля
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Невірні дані для входу'
      });
    }

    // Перевірка пароля
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Невірні дані для входу'
      });
    }

    // Створюємо токен
    const token = generateToken(user._id);

    // Оновлюємо lastLogin
    user.lastLogin = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        shelterId: user.shelterId
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: 'Помилка при вході',
      error: error.message
    });
  }
};

// Вихід користувача (тут нічого активно не робимо, оскільки JWT токен зберігається на клієнті)
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ви успішно вийшли'
  });
};

// Отримання профілю користувача
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувача не знайдено'
      });
    }

    // Додаємо статистику пожертв та інші необхідні дані
    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      favorites: user.favorites || [], 
      donationStats: user.donationStats || {
        totalAmount: 0,
        donationsCount: 0
      }
    };

    // Додаємо статистику для волонтера
    if (user.userType === 'volunteer') {
      // Кількість запитів на усиновлення
      const requestsCount = await AdoptionRequest.countDocuments({ 
        user: user._id, 
        status: { $in: ['pending', 'approved'] }
      });
      
      // Кількість активних запитів
      const pendingRequestsCount = await AdoptionRequest.countDocuments({ 
        user: user._id, 
        status: 'pending'
      });
      
      // Кількість усиновлених тварин
      const adoptionsCount = await Animal.countDocuments({ 
        adoptedBy: user._id 
      });
      
      // Кількість улюблених тварин
      const favoriteAnimalsCount = user.favorites ? user.favorites.length : 0;
      
      userData = {
        ...userData,
        requestsCount,
        pendingRequestsCount,
        adoptionsCount,
        favoriteAnimalsCount
      };
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error("Помилка при отриманні профілю:", error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера при отриманні профілю',
      error: error.message
    });
  }
};

// Оновлення профілю
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    const updateData = { name, email, phone };
    
    // Якщо це притулок, оновлюємо також адресу
    if (req.user.userType === 'shelter' && address) {
      updateData.address = address;
    }
    
    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true
    });
    
    // Якщо це притулок, оновлюємо також дані притулку
    if (req.user.userType === 'shelter' && req.user.shelterId) {
      await Shelter.findByIdAndUpdate(req.user.shelterId, {
        name,
        email,
        phone,
        address
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        shelterId: user.shelterId,
        phone: user.phone,
        address: user.address,
        shelterType: user.shelterType
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(400).json({
      success: false,
      message: 'Не вдалося оновити профіль',
      error: error.message
    });
  }
};

// Оновлення пароля
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Перевірка поточного пароля
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Невірний поточний пароль'
      });
    }
    
    // Оновлення пароля
    user.password = newPassword;
    await user.save();
    
    // Створення нового токена
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(400).json({
      success: false,
      message: 'Не вдалося оновити пароль',
      error: error.message
    });
  }
};

// Запит на відновлення пароля
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувача з таким email не знайдено'
      });
    }
    
    // Генерація токена для скидання пароля
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 хвилин
    
    await user.save();
    
    // Якщо все успішно, відправляємо токен у відповіді (для тестування)
    // У реальному проекті тут буде відправка електронного листа з посиланням
    res.status(200).json({
      success: true,
      message: 'Посилання для відновлення паролю відправлено на ваш email',
      resetToken: resetToken
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: 'Не вдалося відправити запит на відновлення пароля',
      error: error.message
    });
  }
};

// Скидання пароля
exports.resetPassword = async (req, res) => {
  try {
    // Хешування токена для порівняння
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    // Пошук користувача з дійсним токеном
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Недійсний токен або термін дії токена закінчився'
      });
    }
    
    // Оновлення пароля
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Створення нового токена авторизації
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      message: 'Пароль успішно змінено'
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({
      success: false,
      message: 'Не вдалося скинути пароль',
      error: error.message
    });
  }
};