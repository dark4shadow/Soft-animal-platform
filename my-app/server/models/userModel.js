const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Ім'я обов'язкове"],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email обов\'язковий'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Введіть дійсний email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Пароль обов\'язковий'],
    minlength: [6, 'Пароль має бути не менше 6 символів'],
    select: false // не повертати пароль у відповіді
  },
  userType: {
    type: String,
    required: true,
    enum: ['volunteer', 'shelter', 'admin'],
    default: 'volunteer'
  },
  shelterId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Shelter',
    required: function() {
      // Вимагаємо shelterId тільки для існуючих користувачів з типом shelter
      return this.userType === 'shelter' && this.isModified('shelterId');
    }
  },
  phone: {
    type: String,
    required: [true, 'Телефон обов\'язковий'],
    trim: true
  },
  address: {
    type: String,
    required: function() {
      return this.userType === 'shelter';
    },
    trim: true
  },
  shelterType: {
    type: String,
    enum: ['shelter', 'clinic', 'breeder', 'other'],
    default: 'shelter',
    required: function() {
      return this.userType === 'shelter';
    }
  },
  avatar: {
    type: String,
    default: '/uploads/avatars/default.png'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  donationStats: {
    totalAmount: {
      type: Number,
      default: 0
    },
    donationsCount: {
      type: Number,
      default: 0
    },
    lastDonationDate: {
      type: Date,
      default: null
    }
  }
});

// Хешування пароля перед збереженням
UserSchema.pre('save', async function(next) {
  // Якщо пароль не був змінений, пропускаємо
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Метод для порівняння паролів
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);