const mongoose = require('mongoose');
const crypto = require('crypto');

const SubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email обов\'язковий'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Будь ласка, вкажіть дійсну email адресу'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unsubscribeToken: {
    type: String,
    default: function() {
      // Генеруємо випадковий токен для відписки
      return crypto.randomBytes(20).toString('hex');
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Індекс для швидкого пошуку
SubscriptionSchema.index({ email: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);