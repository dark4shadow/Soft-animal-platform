const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ім'я тварини обов'язкове"],
      trim: true
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter',
      required: [true, 'Тварина має бути прив\'язана до притулку']
    },
    type: {
      type: String,
      required: [true, 'Тип тварини обов\'язковий'],
      enum: ['cat', 'dog', 'rabbit', 'other']
    },
    age: {
      type: String,
      required: [true, 'Вік тварини обов\'язковий']
    },
    gender: {
      type: String,
      required: [true, 'Стать тварини обов\'язкова'],
      enum: ['Хлопчик', 'Дівчинка']
    },
    health: {
      type: String,
      default: 'Здоров(а)'
    },
    description: {
      type: String,
      required: [true, 'Опис тварини обов\'язковий'],
      maxlength: [1000, 'Опис не може бути довшим 1000 символів']
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/500'
    },
    gallery: {
      type: [String]
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'adopted'],
      default: 'available'
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    favoritesCount: {
      type: Number,
      default: 0
    },
    location: {
      type: String,
      required: [true, 'Місцезнаходження тварини обов\'язкове']
    },
    needsAmount: {
      type: Number,
      default: 0
    },
    collectedAmount: {
      type: Number,
      default: 0
    },
    medicalNeeds: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Віртуальне поле для заповнення даних про притулок
animalSchema.virtual('shelterInfo', {
  ref: 'Shelter',
  localField: 'shelterId',
  foreignField: '_id',
  justOne: true
});

const Animal = mongoose.model('Animal', animalSchema);
module.exports = Animal;