const mongoose = require('mongoose');

const animalIntakeRequestSchema = new mongoose.Schema(
  {
    // Волонтер, який знайшов/подає тварину
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Притулок, до якого подається запит (може бути не вказаний - тоді це відкритий запит)
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter'
    },
    // Інформація про тварину
    animalInfo: {
      type: {
        type: String,
        required: [true, 'Тип тварини обов\'язковий'],
        enum: ['cat', 'dog', 'other']
      },
      breed: String,
      estimatedAge: String,
      gender: {
        type: String,
        enum: ['male', 'female', 'unknown']
      },
      // Стан здоров'я тварини
      health: {
        type: String,
        required: [true, 'Опис стану здоров\'я обов\'язковий']
      },
      description: {
        type: String,
        required: [true, 'Опис тварини обов\'язковий']
      }
    },
    // Деталі знахідки
    foundDetails: {
      location: {
        type: String,
        required: [true, 'Місце знаходження тварини обов\'язкове']
      },
      date: {
        type: Date,
        default: Date.now
      },
      circumstances: String
    },
    // Інформація про тимчасове утримання
    temporaryKeeping: {
      isKept: {
        type: Boolean,
        default: false
      },
      limitDate: Date,
      conditions: String
    },
    // Терміновість
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    // Статус запиту
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    // Коментарі по запиту
    comment: String,
    // Фото тварини
    photos: [String],
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AnimalIntakeRequest', animalIntakeRequestSchema);