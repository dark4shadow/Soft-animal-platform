const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

// Цей файл буде імпортувати контролер відгуків, коли він буде створений
// const reviewController = require('../controllers/reviewController');

// Базові маршрути для відгуків
router.route('/')
  .get((req, res) => {
    res.status(200).json({ message: "Отримання списку відгуків - буде реалізовано" });
  });

router.route('/:id')
  .get((req, res) => {
    res.status(200).json({ message: "Отримання відгуку - буде реалізовано" });
  })
  .put(protect, (req, res) => {
    res.status(200).json({ message: "Оновлення відгуку - буде реалізовано" });
  })
  .delete(protect, (req, res) => {
    res.status(200).json({ message: "Видалення відгуку - буде реалізовано" });
  });

module.exports = router;