const BlogPost = require('../models/blogPostModel');
const BlogCategory = require('../models/blogCategoryModel');
const BlogComment = require('../models/blogCommentModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');
const slugify = require('slugify');
const path = require('path');
const fs = require('fs');

// @desc    Отримати всі пости блогу
// @route   GET /api/blog/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    // Фільтрація, пагінація і сортування
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    
    // Базовий запит
    const query = { status: 'published' };
    
    // Додаємо фільтрацію за категорією, якщо вказана
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Додаємо фільтрацію за тегами, якщо вказані
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }
    
    // Додаємо пошук за ключовим словом, якщо вказане
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ];
    }
    
    // Вибираємо поле для сортування
    const sortField = req.query.sort || '-createdAt';
    
    // Отримуємо кількість документів, які відповідають запиту
    const total = await BlogPost.countDocuments(query);
    
    // Якщо немає результатів, повертаємо порожній масив без пагінації
    if (total === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }
    
    // Отримуємо пости
    const posts = await BlogPost.find(query)
      .sort(sortField)
      .skip(startIndex)
      .limit(limit)
      .populate('author', 'name avatar')
      .populate('category', 'name slug');
    
    // Вираховуємо загальну кількість сторінок
    const totalPages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error getting blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання постів',
      error: error.message
    });
  }
};

// @desc    Отримати останні пости блогу
// @route   GET /api/blog/posts/recent
// @access  Public
exports.getRecentPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const posts = await BlogPost.find({ status: 'published' })
      .sort('-createdAt')
      .limit(limit)
      .populate('author', 'name avatar')
      .populate('category', 'name slug');
    
    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error getting recent posts:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання останніх постів',
      error: error.message
    });
  }
};

// @desc    Отримати популярні пости блогу
// @route   GET /api/blog/posts/popular
// @access  Public
exports.getPopularPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const posts = await BlogPost.find({ status: 'published' })
      .sort('-views')
      .limit(limit)
      .populate('author', 'name avatar')
      .populate('category', 'name slug');
    
    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error getting popular posts:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання популярних постів',
      error: error.message
    });
  }
};

// @desc    Отримати пост за ID
// @route   GET /api/blog/posts/:id
// @access  Public
exports.getPostById = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('category', 'name slug')
      .populate({
        path: 'comments',
        match: { isApproved: true },
        options: { sort: { createdAt: -1 }, limit: 10 },
        populate: { path: 'user', select: 'name avatar' }
      });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не знайдено'
      });
    }
    
    // Інкремент кількості переглядів
    post.views += 1;
    await post.save();
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error getting blog post by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання поста',
      error: error.message
    });
  }
};

// @desc    Отримати пост за slug
// @route   GET /api/blog/posts/slug/:slug
// @access  Public
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug })
      .populate('author', 'name avatar')
      .populate('category', 'name slug')
      .populate({
        path: 'comments',
        match: { isApproved: true },
        options: { sort: { createdAt: -1 }, limit: 10 },
        populate: { path: 'user', select: 'name avatar' }
      });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не знайдено'
      });
    }
    
    // Інкремент кількості переглядів
    post.views += 1;
    await post.save();
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error getting blog post by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання поста',
      error: error.message
    });
  }
};

// @desc    Отримати всі категорії блогу
// @route   GET /api/blog/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort('name');
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting blog categories:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання категорій',
      error: error.message
    });
  }
};

// @desc    Створити нову категорію блогу
// @route   POST /api/blog/categories
// @access  Private (Admin)
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Будь ласка, надайте назву категорії'
      });
    }
    
    // Створення slug з назви категорії
    const slug = slugify(name, { lower: true, strict: true });
    
    // Перевірка, чи така категорія вже існує
    const existingCategory = await BlogCategory.findOne({ 
      $or: [{ name: name }, { slug: slug }] 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Категорія з такою назвою вже існує'
      });
    }
    
    // Створення нової категорії
    const category = await BlogCategory.create({
      name,
      slug
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error creating blog category:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка створення категорії',
      error: error.message
    });
  }
};

// @desc    Отримати категорію за ID
// @route   GET /api/blog/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категорію не знайдено'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error getting category by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання категорії',
      error: error.message
    });
  }
};

// @desc    Оновити категорію блогу
// @route   PUT /api/blog/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Будь ласка, надайте назву категорії'
      });
    }
    
    const category = await BlogCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категорію не знайдено'
      });
    }
    
    const updatedData = {
      name,
      slug: slug || slugify(name, { lower: true, strict: true })
    };
    
    const updatedCategory = await BlogCategory.findByIdAndUpdate(
      req.params.id, 
      updatedData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating blog category:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка оновлення категорії',
      error: error.message
    });
  }
};

// @desc    Видалити категорію блогу
// @route   DELETE /api/blog/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категорію не знайдено'
      });
    }
    
    // Перевіряємо, чи не використовується категорія в постах
    const postsCount = await BlogPost.countDocuments({ category: req.params.id });
    
    if (postsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Неможливо видалити категорію, оскільки вона використовується в ${postsCount} постах`
      });
    }
    
    await category.remove();
    
    res.status(200).json({
      success: true,
      message: 'Категорію успішно видалено'
    });
  } catch (error) {
    console.error('Error deleting blog category:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка видалення категорії',
      error: error.message
    });
  }
};

// @desc    Отримати коментарі до поста
// @route   GET /api/blog/posts/:id/comments
// @access  Public
exports.getPostComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    
    const comments = await BlogComment.find({
      post: req.params.id,
      isApproved: true
    })
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit)
      .populate('user', 'name avatar');
    
    const total = await BlogComment.countDocuments({
      post: req.params.id,
      isApproved: true
    });
    
    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting post comments:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання коментарів',
      error: error.message
    });
  }
};

// @desc    Додати коментар до поста
// @route   POST /api/blog/posts/:id/comments
// @access  Public
exports.addComment = async (req, res) => {
  try {
    const { author, email, content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Текст коментаря обов\'язковий'
      });
    }
    
    // Перевіряємо, чи існує пост
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не знайдено'
      });
    }
    
    // Створюємо коментар
    const commentData = {
      post: req.params.id,
      content,
      isApproved: true // За замовчуванням коментарі схвалені
    };
    
    // Якщо користувач авторизований, використовуємо його ID
    if (req.user) {
      commentData.user = req.user.id;
    } else {
      // Для неавторизованих користувачів вимагаємо ім'я та email
      if (!author || !email) {
        return res.status(400).json({
          success: false,
          message: 'Будь ласка, вкажіть ім\'я та email'
        });
      }
      
      // Створюємо тимчасового користувача для коментаря
      commentData.author = author;
      commentData.email = email;
      commentData.isApproved = false; // Неавторизовані коментарі потребують модерації
    }
    
    const comment = await BlogComment.create(commentData);
    
    // Якщо коментар від авторизованого користувача, популюємо дані користувача
    const populatedComment = await BlogComment.findById(comment._id)
      .populate('user', 'name avatar');
    
    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка додавання коментаря',
      error: error.message
    });
  }
};

// @desc    Схвалити коментар
// @route   PUT /api/blog/comments/:id/approve
// @access  Private (Admin or Shelter)
exports.approveComment = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Коментар не знайдено'
      });
    }
    
    comment.isApproved = true;
    await comment.save();
    
    res.status(200).json({
      success: true,
      message: 'Коментар схвалено',
      data: comment
    });
  } catch (error) {
    console.error('Error approving comment:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка схвалення коментаря',
      error: error.message
    });
  }
};

// @desc    Видалити коментар
// @route   DELETE /api/blog/comments/:id
// @access  Private (Admin or Shelter)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Коментар не знайдено'
      });
    }
    
    // Якщо коментар належить до поста, оновлюємо кількість коментарів у пості
    if (comment.post) {
      await BlogPost.findByIdAndUpdate(comment.post, {
        $inc: { commentsCount: -1 }
      });
    }
    
    await comment.remove();
    
    res.status(200).json({
      success: true,
      message: 'Коментар видалено'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка видалення коментаря',
      error: error.message
    });
  }
};

// @desc    Створити новий пост блогу
// @route   POST /api/blog/posts
// @access  Private (Admin or Shelter)
exports.createPost = async (req, res) => {
  try {
    // Перевірка необхідних полів
    if (!req.body.title || !req.body.content || !req.body.category) {
      return res.status(400).json({
        success: false,
        message: 'Будь ласка, заповніть всі обов\'язкові поля'
      });
    }
    
    // Обробка зображення, якщо воно є
    let imagePath = undefined;
    
    if (req.file) {
      imagePath = `/uploads/blog/${req.file.filename}`;
    }
    
    // Створення slug з назви поста
    const slug = slugify(req.body.title, {
      lower: true,
      strict: true,
      locale: 'uk'
    });
    
    // Перевірка унікальності slug
    const existingPost = await BlogPost.findOne({ slug });
    
    if (existingPost) {
      // Якщо slug вже існує, додаємо до нього timestamp
      const uniqueSlug = `${slug}-${Date.now().toString().slice(-6)}`;
      req.body.slug = uniqueSlug;
    } else {
      req.body.slug = slug;
    }
    
    // Додаємо автора
    req.body.author = req.user.id;
    
    // Додаємо зображення, якщо воно є
    if (imagePath) {
      req.body.image = imagePath;
    }
    
    // Обробка тегів, якщо вони надані як рядок
    if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
    }
    
    const post = await BlogPost.create(req.body);
    
    // Повертаємо створений пост з популяцією автора та категорії
    const populatedPost = await BlogPost.findById(post._id)
      .populate('author', 'name avatar')
      .populate('category', 'name slug');
    
    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка створення поста',
      error: error.message
    });
  }
};

// @desc    Оновити пост блогу
// @route   PUT /api/blog/posts/:id
// @access  Private (Admin or Post Owner)
exports.updatePost = async (req, res) => {
  try {
    let post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не знайдено'
      });
    }
    
    // Перевірка прав доступу
    if (req.user.userType !== 'admin' && post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Ви не маєте прав для редагування цього поста'
      });
    }
    
    // Обробка зображення, якщо воно є
    if (req.file) {
      // Видалення старого зображення
      if (post.image && post.image !== '/uploads/blog/default.jpg' && post.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', 'public', post.image);
        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      req.body.image = `/uploads/blog/${req.file.filename}`;
    }
    
    // Оновлення slug, якщо змінилася назва
    if (req.body.title && req.body.title !== post.title) {
      const slug = slugify(req.body.title, {
        lower: true,
        strict: true,
        locale: 'uk'
      });
      
      // Перевірка унікальності slug
      const existingPost = await BlogPost.findOne({ 
        slug, 
        _id: { $ne: post._id } 
      });
      
      if (existingPost) {
        // Якщо slug вже існує, додаємо до нього timestamp
        const uniqueSlug = `${slug}-${Date.now().toString().slice(-6)}`;
        req.body.slug = uniqueSlug;
      } else {
        req.body.slug = slug;
      }
    }
    
    // Обробка тегів, якщо вони надані як рядок
    if (typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
    }
    
    // Оновлення поста
    post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('author', 'name avatar')
      .populate('category', 'name slug');
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка оновлення поста',
      error: error.message
    });
  }
};

// @desc    Отримати всі унікальні теги з постів
// @route   GET /api/blog/tags
// @access  Public
exports.getTags = async (req, res) => {
  try {
    const tags = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 } // Обмежуємо до 30 найпопулярніших тегів
    ]);
    
    res.status(200).json({
      success: true,
      data: tags.map(tag => ({ name: tag._id, count: tag.count }))
    });
  } catch (error) {
    console.error('Error getting blog tags:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання тегів блогу',
      error: error.message
    });
  }
};

// @desc    Видалити пост блогу
// @route   DELETE /api/blog/posts/:id
// @access  Private (Admin or Post Owner)
exports.deletePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не знайдено'
      });
    }
    
    // Перевірка прав доступу
    if (req.user.userType !== 'admin' && post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Ви не маєте прав для видалення цього поста'
      });
    }
    
    // Видалення зображення, якщо воно не є дефолтним
    if (post.image && post.image !== '/uploads/blog/default.jpg' && post.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', 'public', post.image);
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Видалення коментарів до поста
    await BlogComment.deleteMany({ post: post._id });
    
    // Видалення поста
    await post.remove();
    
    res.status(200).json({
      success: true,
      message: 'Пост успішно видалено'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка видалення поста',
      error: error.message
    });
  }
};

// @desc    Вподобати пост
// @route   POST /api/blog/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не знайдено'
      });
    }
    
    // Оновлюємо кількість лайків
    post.likes += 1;
    await post.save();
    
    res.status(200).json({
      success: true,
      message: 'Вам сподобався цей пост',
      likes: post.likes
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при вподобанні поста',
      error: error.message
    });
  }
};

// @desc    Прибрати вподобання з поста
// @route   DELETE /api/blog/posts/:id/like
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не знайдено'
      });
    }
    
    // Зменшуємо кількість лайків, але не менше 0
    if (post.likes > 0) {
      post.likes -= 1;
      await post.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Вподобання видалено',
      likes: post.likes
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні вподобання',
      error: error.message
    });
  }
};

// @desc    Отримати пов'язані пости
// @route   GET /api/blog/posts/:id/related
// @access  Public
exports.getRelatedPosts = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Пост не знайдено'
      });
    }
    
    // Знаходимо пов'язані пости за категорією та тегами
    const relatedPosts = await BlogPost.find({
      _id: { $ne: post._id },
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } }
      ],
      status: 'published'
    })
      .sort('-createdAt')
      .limit(4)
      .populate('author', 'name avatar')
      .populate('category', 'name slug');
    
    res.status(200).json({
      success: true,
      data: relatedPosts
    });
  } catch (error) {
    console.error('Error getting related posts:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання пов\'язаних постів',
      error: error.message
    });
  }
};

// @desc    Підписатися на розсилку новин
// @route   POST /api/blog/subscribe
// @access  Public
exports.subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email адреса обов\'язкова'
      });
    }
    
    // Перевіряємо, чи такий email вже підписаний
    const existingSubscription = await Subscription.findOne({ email });
    
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Ця email адреса вже підписана на нашу розсилку'
      });
    }
    
    // Створюємо нову підписку
    await Subscription.create({ email });
    
    res.status(201).json({
      success: true,
      message: 'Дякуємо за підписку на нашу розсилку!'
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при підписці на розсилку',
      error: error.message
    });
  }
};

// @desc    Відписатися від розсилки новин
// @route   DELETE /api/blog/unsubscribe
// @access  Public
exports.unsubscribeFromNewsletter = async (req, res) => {
  try {
    const { email, token } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email адреса обов\'язкова'
      });
    }
    
    // Знаходимо підписку
    const subscription = await Subscription.findOne({ email });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Підписку не знайдено'
      });
    }
    
    // Перевіряємо токен для безпечної відписки
    if (token && subscription.unsubscribeToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Невірний токен відписки'
      });
    }
    
    // Видаляємо підписку
    await subscription.remove();
    
    res.status(200).json({
      success: true,
      message: 'Ви успішно відписалися від розсилки'
    });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при відписці від розсилки',
      error: error.message
    });
  }
};

// @desc    Отримати статистику блогу
// @route   GET /api/blog/stats
// @access  Private (Admin)
exports.getBlogStats = async (req, res) => {
  try {
    // Загальна кількість постів за статусами
    const postsCount = await BlogPost.countDocuments();
    const publishedPostsCount = await BlogPost.countDocuments({ status: 'published' });
    const draftPostsCount = await BlogPost.countDocuments({ status: 'draft' });
    
    // Загальна кількість категорій
    const categoriesCount = await BlogCategory.countDocuments();
    
    // Загальна кількість коментарів
    const commentsCount = await BlogComment.countDocuments();
    const pendingCommentsCount = await BlogComment.countDocuments({ isApproved: false });
    
    // Кількість підписників на розсилку
    const subscribersCount = await Subscription.countDocuments();
    
    // Найпопулярніші пости
    const topPosts = await BlogPost.find()
      .sort('-views')
      .limit(5)
      .select('title views slug');
    
    // Кількість постів за категоріями
    const postsByCategory = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Популярні категорії
    for (let i = 0; i < postsByCategory.length; i++) {
      const category = await BlogCategory.findById(postsByCategory[i]._id)
        .select('name slug');
      
      if (category) {
        postsByCategory[i].category = category;
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        posts: {
          total: postsCount,
          published: publishedPostsCount,
          drafts: draftPostsCount
        },
        categories: categoriesCount,
        comments: {
          total: commentsCount,
          pending: pendingCommentsCount
        },
        subscribers: subscribersCount,
        topPosts,
        postsByCategory
      }
    });
  } catch (error) {
    console.error('Error getting blog stats:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання статистики блогу',
      error: error.message
    });
  }
};