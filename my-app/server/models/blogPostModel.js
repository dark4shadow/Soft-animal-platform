const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Будь ласка, вкажіть заголовок поста'],
    trim: true,
    maxlength: [200, 'Заголовок не може бути довшим за 200 символів']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  content: {
    type: String,
    required: [true, 'Будь ласка, додайте вміст поста']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Короткий опис не може бути довшим за 500 символів']
  },
  image: {
    type: String,
    default: '/uploads/blog/default.jpg'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogCategory',
    required: true
  },
  tags: [String],
  readTime: {
    type: Number,
    default: 5
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Віртуальне поле для коментарів
BlogPostSchema.virtual('comments', {
  ref: 'BlogComment',
  localField: '_id',
  foreignField: 'post'
});

// Авто-оновлення поля updatedAt
BlogPostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Індекси для швидкого пошуку
BlogPostSchema.index({ title: 'text', content: 'text', tags: 'text' });
BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ author: 1 });
BlogPostSchema.index({ category: 1 });
BlogPostSchema.index({ status: 1 });
BlogPostSchema.index({ createdAt: -1 });
BlogPostSchema.index({ views: -1 });

// Автоматичне створення excerpt, якщо він не наданий
BlogPostSchema.pre('save', function(next) {
  if (!this.excerpt && this.content) {
    // Видаляємо HTML теги і скорочуємо до 300 символів
    this.excerpt = this.content
      .replace(/<[^>]*>/g, '')
      .substring(0, 300)
      .trim();
    
    // Якщо excerpt був скорочений, додаємо "..."
    if (this.content.length > 300) {
      this.excerpt += '...';
    }
  }
  
  next();
});

module.exports = mongoose.model('BlogPost', BlogPostSchema);