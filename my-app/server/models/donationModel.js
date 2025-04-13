const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Будь ласка, вкажіть суму пожертви'],
    min: [20, 'Мінімальна сума пожертви - 20 грн']
  },
  donorName: {
    type: String,
    required: [true, 'Будь ласка, вкажіть ваше ім\'я']
  },
  donorEmail: {
    type: String,
    required: [true, 'Будь ласка, вкажіть ваш email'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Будь ласка, вкажіть коректний email']
  },
  target: {
    type: String,
    enum: ['general', 'shelter', 'animal'],
    default: 'general'
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['Shelter', 'Animal'],
    required: function() {
      return this.target !== 'general';
    }
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'liqpay', 'paypal', 'crypto'],
    default: 'card'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  message: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Оновлення дати при зміні
DonationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Індекси для швидкого пошуку
DonationSchema.index({ status: 1 });
DonationSchema.index({ target: 1, targetId: 1 });
DonationSchema.index({ donorEmail: 1 });
DonationSchema.index({ createdAt: -1 });
DonationSchema.index({ user: 1 });

module.exports = mongoose.model('Donation', DonationSchema);