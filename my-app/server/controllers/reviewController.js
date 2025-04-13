const Review = require('../models/reviewModel');
const Shelter = require('../models/shelterModel');

// Отримати усі відгуки для притулку
exports.getShelterReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ shelterId: req.params.id })
      .sort('-createdAt');
      
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося отримати відгуки',
      error: error.message
    });
  }
};

// Додати відгук для притулку
exports.addReview = async (req, res) => {
  try {
    // Додаємо shelterId з URL параметрів
    req.body.shelterId = req.params.id;
    
    // Якщо користувач авторизований, додаємо його ID
    if (req.user) {
      req.body.userId = req.user.id;
    }
    
    // Перевіряємо, чи існує притулок
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Притулок не знайдено'
      });
    }
    
    // Перевіряємо, чи користувач вже залишав відгук (якщо авторизований)
    if (req.user) {
      const alreadyReviewed = await Review.findOne({
        shelterId: req.params.id,
        userId: req.user.id
      });
      
      if (alreadyReviewed) {
        return res.status(400).json({
          success: false,
          message: 'Ви вже залишили відгук для цього притулку'
        });
      }
    }
    
    // Створюємо відгук
    const review = await Review.create(req.body);
    
    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Не вдалося додати відгук',
      error: error.message
    });
  }
};

// Оновити відгук
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Відгук не знайдено'
      });
    }
    
    // Перевірка дозволів
    if (req.user && (review.userId && review.userId.toString() !== req.user.id) && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Ви не маєте права редагувати цей відгук'
      });
    }
    
    review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося оновити відгук',
      error: error.message
    });
  }
};

// Видалити відгук
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Відгук не знайдено'
      });
    }
    
    // Перевірка дозволів
    if (req.user && (review.userId && review.userId.toString() !== req.user.id) && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Ви не маєте права видаляти цей відгук'
      });
    }
    
    await review.remove();
    
    res.status(200).json({
      success: true,
      message: 'Відгук успішно видалено'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не вдалося видалити відгук',
      error: error.message
    });
  }
};