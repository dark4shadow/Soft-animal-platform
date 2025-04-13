const mongoose = require('mongoose');

const BlogCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Ім'я категорії обов'язкове"],
    trim: true,
    maxlength: [50, "Ім'я категорії не може бути більше 50 символів"]
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: [500, "Опис не може бути більше 500 символів"]
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Індекси для швидкого пошуку
BlogCategorySchema.index({ slug: 1 });

module.exports = mongoose.model('BlogCategory', BlogCategorySchema);