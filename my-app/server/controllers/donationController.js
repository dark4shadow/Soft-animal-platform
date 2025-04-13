const Donation = require('../models/donationModel');
const Shelter = require('../models/shelterModel');
const Animal = require('../models/animalModel');
const User = require('../models/userModel'); // Added User model for email lookup
const { generatePaymentForm } = require('../utils/paymentHelper');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Added jwt for token verification


// @desc    Отримати всі пожертви (для адміністратора)
// @route   GET /api/donations
// @access  Private (Admin)
exports.getDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    
    // Формуємо фільтр
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.target) {
      filter.target = req.query.target;
    }
    
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(req.query.dateFrom);
      }
      
      if (req.query.dateTo) {
        filter.createdAt.$lte = new Date(req.query.dateTo);
      }
    }
    
    // Отримуємо кількість пожертв за фільтром
    const total = await Donation.countDocuments(filter);
    
    // Отримуємо пожертви з пагінацією
    const donations = await Donation.find(filter)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('user', 'name email')
      .populate('targetId', 'name');
    
    res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting donations:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні пожертв',
      error: error.message
    });
  }
};

// @desc    Отримати одну пожертву
// @route   GET /api/donations/:id
// @access  Private/Admin
exports.getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('user', 'name email')
      .populate('shelter', 'name')
      .populate('animal', 'name');
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: `Пожертва з ID ${req.params.id} не знайдена`
      });
    }
    
    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    console.error('Error getting donation:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка отримання пожертви',
      error: error.message
    });
  }
};

// @desc    Створити нову пожертву
// @route   POST /api/donations
// @access  Public
exports.createDonation = async (req, res) => {
  try {
    console.log("Отримано запит на створення пожертви:", req.body);
    
    const { 
      amount, 
      donorName, 
      donorEmail, 
      message, 
      user, 
      target, 
      targetId, 
      paymentMethod 
    } = req.body;
    
    // Перевірка суми пожертви
    if (!amount || amount < 20) {
      return res.status(400).json({
        success: false,
        message: 'Мінімальна сума пожертви - 20 грн'
      });
    }
    
    // Отримуємо авторизаційні дані
    const token = req.headers.authorization?.split(' ')[1];
    let userId;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
        console.log("ID авторизованого користувача:", userId);
      } catch(e) {
        console.log("Помилка декодування токена:", e.message);
      }
    }

    // Визначаємо цільову модель на основі target
    let targetModel = null;
    if (target === 'shelter') {
      targetModel = 'Shelter';
    } else if (target === 'animal') {
      targetModel = 'Animal';
    }
    
    // Створюємо запис про пожертву
    const donationData = {
      amount,
      donorName,
      donorEmail,
      message,
      paymentMethod,
      target,
      status: 'completed', // Змінюємо на 'completed' для тестового режиму
    };

    // Спочатку перевіряємо ID з токена авторизації
    if (userId) {
      donationData.user = userId;
      console.log("Використовуємо ID з авторизаційного токена:", userId);
    }
    // Якщо немає ID з токена, але передано в тілі запиту
    else if (user) {
      donationData.user = user;
      console.log("Використовуємо ID з тіла запиту:", user);
    } 
    // Останній варіант - шукаємо за email
    else if (donorEmail) {
      // Пошук за email як раніше
      let userData = await User.findOne({ email: donorEmail });
      if (userData) {
        donationData.user = userData._id;
        console.log("Знайшли користувача за email:", userData._id);
      }
    }
    
    // Якщо знайшли користувача, оновлюємо його статистику
    if (donationData.user) {
      await User.findByIdAndUpdate(
        donationData.user,
        {
          $inc: { 
            'donationStats.totalAmount': amount,
            'donationStats.donationsCount': 1 
          },
          $set: { 'donationStats.lastDonationDate': new Date() }
        }
      );
      console.log(`Оновлено статистику пожертв користувача ${donationData.user}`);
    }
    
    // Решта коду залишається незмінною...
    if (targetId && target !== 'general') {
      donationData.targetId = targetId;
      donationData.targetModel = targetModel;
    }
    
    const donation = await Donation.create(donationData);
    console.log("Створено пожертву:", donation);
    
    // Оновлюємо статистику користувача відразу після створення пожертви
    if (donation.user) {
      await User.findByIdAndUpdate(
        donation.user,
        {
          $inc: { 
            'donationStats.totalAmount': donation.amount,
            'donationStats.donationsCount': 1 
          },
          $set: { 'donationStats.lastDonationDate': new Date() }
        },
        { upsert: true } // Створює поле donationStats, якщо воно не існує
      );
      console.log(`Оновлено статистику пожертв користувача ${donation.user}`);
    }
    
    // Якщо це тестовий режим, одразу повертаємо успішний результат
    if (process.env.PAYMENT_TEST_MODE === 'true') {
      // Оновлюємо залежні дані (для спрощення тестування)
      if (donation.target === 'shelter' && donation.targetId) {
        await Shelter.findByIdAndUpdate(donation.targetId, {
          $inc: { donationCurrent: donation.amount }
        });
      } else if (donation.target === 'animal' && donation.targetId) {
        await Animal.findByIdAndUpdate(donation.targetId, {
          $inc: { donationCurrent: donation.amount }
        });
      }
      
      return res.status(200).json({
        success: true,
        data: donation,
        isTest: true,
        message: 'Пожертва успішно оброблена (тестовий режим)'
      });
    }
    
    // Інша логіка для реального платіжного шлюзу
    // ...
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при створенні пожертви',
      error: error.message
    });
  }
};

// @desc    Отримати статистику пожертв
// @route   GET /api/donations/stats
// @access  Public
exports.getDonationStats = async (req, res) => {
  try {
    console.log("Запит на отримання статистики пожертв");
    
    // Загальна сума пожертв
    const totalAmountResult = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    
    console.log("Результат агрегації суми:", totalAmountResult);
    
    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;
    
    // Загальна кількість пожертв
    const countDonations = await Donation.countDocuments({ status: 'completed' });
    console.log("Кількість пожертв:", countDonations);
    
    // Кількість унікальних донорів
    const uniqueDonorsCount = await Donation.distinct('donorEmail', { status: 'completed' }).then(emails => emails.length);
    console.log("Унікальних донорів:", uniqueDonorsCount);
    
    // Кількість притулків, що отримали допомогу
    const sheltersDonatedCount = await Donation.distinct('targetId', { 
      status: 'completed', 
      target: 'shelter'
    }).then(ids => ids.length);
    console.log("Притулків отримали допомогу:", sheltersDonatedCount);
    
    // Кількість тварин, що отримали допомогу
    const animalsDonatedCount = await Donation.distinct('targetId', { 
      status: 'completed', 
      target: 'animal'
    }).then(ids => ids.length);
    console.log("Тварин отримали допомогу:", animalsDonatedCount);
    
    // Перевірка даних демо-режиму
    if (process.env.PAYMENT_TEST_MODE === 'true' && totalAmount === 0) {
      // Якщо тестовий режим і немає даних, додамо демонстраційну статистику
      console.log("Використовуємо демонстраційну статистику для тестового режиму");
      return res.status(200).json({
        success: true,
        totalAmount: 15000,
        countDonations: 45,
        uniqueDonorsCount: 30,
        sheltersDonatedCount: 5,
        animalsDonatedCount: 12
      });
    }
    
    const responseData = {
      success: true,
      totalAmount,
      countDonations,
      uniqueDonorsCount,
      sheltersDonatedCount,
      animalsDonatedCount
    };
    
    console.log("Відправляємо статистику:", responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting donation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики пожертв',
      error: error.message
    });
  }
};

// @desc    Отримати пожертви для конкретного користувача
// @route   GET /api/donations/user/:userId
// @access  Private
exports.getUserDonations = async (req, res) => {
  try {
    // Перевірка, чи користувач має доступ до цих даних
    if (req.params.userId !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до цих даних'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    
    const total = await Donation.countDocuments({ user: req.params.userId });
    
    const donations = await Donation.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting user donations:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні пожертв користувача',
      error: error.message
    });
  }
};

// @desc    Оновити статус пожертви (для обробки колбеків від платіжної системи)
// @route   PUT /api/donations/:id/status
// @access  Public (з верифікацією від платіжної системи)
exports.updateDonationStatus = async (req, res) => {
  try {
    const { status, transactionId } = req.body;
    
    // В реальному проекті тут має бути верифікація підпису від платіжної системи
    // Для прикладу просто оновлюємо статус
    
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      {
        status,
        transactionId,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Пожертву не знайдено'
      });
    }
    
    // Якщо пожертва успішно оплачена, оновлюємо залежні дані
    if (status === 'completed') {
      if (donation.target === 'shelter' && donation.targetId) {
        await Shelter.findByIdAndUpdate(donation.targetId, {
          $inc: { donationCurrent: donation.amount }
        });
      } else if (donation.target === 'animal' && donation.targetId) {
        await Animal.findByIdAndUpdate(donation.targetId, {
          $inc: { donationCurrent: donation.amount }
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    console.error('Error updating donation status:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні статусу пожертви',
      error: error.message
    });
  }
};