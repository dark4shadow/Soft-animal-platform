const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Завантаження змінних середовища
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Підключення моделі
const Donation = require('../models/donationModel');
const User = require('../models/userModel');
const Shelter = require('../models/shelterModel');

// Функція для підключення до бази даних
const connectDB = async () => {
  try {
    // Змінюємо MONGO_URI на MONGODB_URI
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Функція для створення тестових донатів
const createTestDonations = async () => {
  try {
    await Donation.deleteMany({});
    console.log('Видалено старі дані пожертв');
    
    // Перевірка наявності користувачів і притулків для тестових даних
    const userCount = await User.countDocuments();
    const shelterCount = await Shelter.countDocuments();
    
    let randomUserId = null;
    let randomShelterId = null;
    
    if (userCount > 0) {
      const randomUser = await User.findOne().skip(Math.floor(Math.random() * userCount));
      randomUserId = randomUser._id;
    }
    
    if (shelterCount > 0) {
      const randomShelter = await Shelter.findOne().skip(Math.floor(Math.random() * shelterCount));
      randomShelterId = randomShelter._id;
    }
    
    // Створити тестові донати
    const testDonations = [
      {
        amount: 100,
        donorName: 'Іван Петренко',
        donorEmail: 'ivan@example.com',
        target: 'general',
        paymentMethod: 'card',
        status: 'completed',
        message: 'Для загальних потреб платформи',
        user: randomUserId,
        createdAt: new Date('2025-01-15'),
        transactionId: 'test_' + Date.now() + '_1'
      },
      {
        amount: 250,
        donorName: 'Олена Коваль',
        donorEmail: 'olena@example.com',
        target: 'shelter',
        targetId: randomShelterId,
        targetModel: 'Shelter',
        paymentMethod: 'liqpay',
        status: 'completed',
        message: 'На корм для тварин',
        createdAt: new Date('2025-01-18'),
        transactionId: 'test_' + Date.now() + '_2'
      },
      {
        amount: 500,
        donorName: 'Петро Сидоренко',
        donorEmail: 'petro@example.com',
        target: 'general',
        paymentMethod: 'card',
        status: 'completed',
        message: 'Дякую за вашу роботу!',
        user: randomUserId,
        createdAt: new Date('2025-02-05'),
        transactionId: 'test_' + Date.now() + '_3'
      },
      {
        amount: 1000,
        donorName: 'Марія Шевченко',
        donorEmail: 'maria@example.com',
        target: 'shelter',
        targetId: randomShelterId,
        targetModel: 'Shelter',
        paymentMethod: 'card',
        status: 'completed',
        message: 'На будівництво нових вольєрів',
        createdAt: new Date('2025-02-10'),
        transactionId: 'test_' + Date.now() + '_4'
      },
      {
        amount: 150,
        donorName: 'Анна Бойко',
        donorEmail: 'anna@example.com',
        target: 'general',
        paymentMethod: 'liqpay',
        status: 'completed',
        message: 'Допоможіть тваринам',
        createdAt: new Date('2025-02-15'),
        transactionId: 'test_' + Date.now() + '_5'
      }
    ];
    
    await Donation.insertMany(testDonations);
    console.log(`Додано ${testDonations.length} тестових пожертв`);
    
    // Показати статистику
    const totalAmount = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    
    const countDonations = await Donation.countDocuments({ status: 'completed' });
    const uniqueDonorsCount = await Donation.distinct('donorEmail', { status: 'completed' }).then(emails => emails.length);
    
    console.log('Статистика пожертв:');
    console.log(`- Загальна сума: ${totalAmount.length > 0 ? totalAmount[0].totalAmount : 0} грн`);
    console.log(`- Кількість пожертв: ${countDonations}`);
    console.log(`- Унікальних донорів: ${uniqueDonorsCount}`);
    
  } catch (error) {
    console.error(`Помилка при створенні тестових пожертв: ${error}`);
  }
};

// Виконання скрипту
const run = async () => {
  const conn = await connectDB();
  await createTestDonations();
  console.log('Ініціалізація бази даних пожертв завершена!');
  await mongoose.connection.close();
  console.log('З\'єднання з базою даних закрито');
};

run();