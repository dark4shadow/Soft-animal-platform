const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Захист маршрутів (перевірка JWT)
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // If no token found, return unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Необхідна авторизація для доступу до цього ресурсу'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user to request
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Недійсний токен авторизації'
    });
  }
};

// Обмеження доступу за ролями
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Роль ${req.user.userType} не має доступу до цього ресурсу`
      });
    }
    next();
  };
};