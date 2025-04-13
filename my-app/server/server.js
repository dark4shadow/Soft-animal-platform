const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Правильно завантажуємо конфігурацію - вказуємо шлях до файлу .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Тепер можемо імпортувати connectDB, який використовуватиме process.env.MONGODB_URI
const connectDB = require('./config/db');

// Імпорт маршрутів
const animalRoutes = require('./routes/animalRoutes');
const shelterRoutes = require('./routes/shelterRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const blogRoutes = require('./routes/blogRoutes'); // Додаємо маршрути блогу
const donationRoutes = require('./routes/donationRoutes'); // Додаємо маршрути пожертв
const volunteerRoutes = require('./routes/volunteerRoutes'); // Новий імпорт
const animalIntakeRoutes = require('./routes/animalIntakeRoutes'); // Новий імпорт
const adoptionRoutes = require('./routes/adoptionRoutes'); // Новий імпорт

// Підключення до бази даних
connectDB();

// Ініціалізація додатку Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add this middleware before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Створення каталогів для завантажень, якщо вони не існують
const uploadsDir = path.join(__dirname, 'public/uploads');
const animalUploadsDir = path.join(uploadsDir, 'animals');
const shelterUploadsDir = path.join(uploadsDir, 'shelters');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(animalUploadsDir)) {
  fs.mkdirSync(animalUploadsDir, { recursive: true });
}
if (!fs.existsSync(shelterUploadsDir)) {
  fs.mkdirSync(shelterUploadsDir, { recursive: true });
}

// Статичні файли
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Маршрути API
app.use('/api/animals', animalRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blog', blogRoutes); // Підключаємо маршрути блогу
app.use('/api/donations', donationRoutes); // Підключаємо маршрути пожертв
app.use('/api/volunteers', volunteerRoutes);
app.use('/api', animalIntakeRoutes); // Нове підключення
app.use('/api', adoptionRoutes); // Нове підключення

// Обробка помилок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Внутрішня помилка сервера',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Порт
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT} в режимі ${process.env.NODE_ENV}`);
});