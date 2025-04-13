const mongoose = require('mongoose');

const BlogCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Текст коментаря обов\'язковий'],
    trim: true,
    maxlength: [1000, 'Коментар не може бути більше 1000 символів']
  },
  likes: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: true
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

// Індекси для швидкого пошуку
BlogCommentSchema.index({ post: 1, createdAt: -1 });
BlogCommentSchema.index({ user: 1 });

// Middleware для оновлення поля updatedAt перед збереженням
BlogCommentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BlogComment', BlogCommentSchema);