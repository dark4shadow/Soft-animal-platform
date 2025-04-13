const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Завантаження змінних середовища
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/userModel');
const Donation = require('../models/donationModel');

// Функція для підключення до бази даних
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB підключено: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Помилка підключення до MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Міграція для оновлення статистики пожертв користувачів
const updateUserDonationStats = async () => {
  try {
    console.log('Початок оновлення статистики пожертв користувачів...');
    
    // Отримуємо всіх користувачів
    const users = await User.find();
    console.log(`Знайдено ${users.length} користувачів`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      // Шукаємо всі пожертви користувача
      const donations = await Donation.find({ 
        $or: [
          { user: user._id },
          { donorEmail: user.email }
        ],
        status: 'completed'
      });
      
      if (donations.length > 0) {
        // Рахуємо загальну суму пожертв
        const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
        const lastDonation = donations.sort((a, b) => b.createdAt - a.createdAt)[0];
        
        // Оновлюємо статистику користувача
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'donationStats.totalAmount': totalAmount,
            'donationStats.donationsCount': donations.length,
            'donationStats.lastDonationDate': lastDonation.createdAt
          }
        });
        
        updatedCount++;
        console.log(`Оновлено користувача ${user.name} (${user.email}): ${donations.length} пожертв, ${totalAmount} грн.`);
      }
    }
    
    console.log(`Оновлено статистику для ${updatedCount} користувачів`);
    
  } catch (error) {
    console.error('Помилка оновлення статистики пожертв:', error);
  }
};

// Виконуємо міграцію
const runMigration = async () => {
  try {
    await connectDB();
    await updateUserDonationStats();
    console.log('Міграція успішно завершена');
    process.exit(0);
  } catch (error) {
    console.error('Помилка міграції:', error);
    process.exit(1);
  }
};

runMigration();