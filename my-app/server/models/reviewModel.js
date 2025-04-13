const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter',
      required: [true, 'Відгук має бути прив\'язаний до притулку']
    },
    author: {
      type: String,
      required: [true, "Ім'я автора обов'язкове"],
      trim: true
    },
    rating: {
      type: Number,
      required: [true, 'Рейтинг обов\'язковий'],
      min: 1,
      max: 5
    },
    text: {
      type: String,
      required: [true, 'Текст відгуку обов\'язковий'],
      trim: true,
      maxlength: [500, 'Текст відгуку не може перевищувати 500 символів']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
      // не обов'язкове поле, оскільки відгуки можуть бути анонімними
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Запобігання дублювання відгуків одним користувачем
reviewSchema.index({ shelterId: 1, userId: 1 }, { unique: true, sparse: true });

// Статичний метод для обчислення середнього рейтингу для притулку
reviewSchema.statics.calcAverageRating = async function(shelterId) {
  const stats = await this.aggregate([
    {
      $match: { shelterId }
    },
    {
      $group: {
        _id: '$shelterId',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Shelter').findByIdAndUpdate(shelterId, {
      rating: stats[0].avgRating,
      reviewsCount: stats[0].numReviews
    });
  } else {
    await mongoose.model('Shelter').findByIdAndUpdate(shelterId, {
      rating: 0,
      reviewsCount: 0
    });
  }
};

// Після збереження відгуку - перерахувати рейтинг притулку
reviewSchema.post('save', function() {
  this.constructor.calcAverageRating(this.shelterId);
});

// Забезпечуємо перерахунок рейтингу після видалення відгуку
reviewSchema.post('remove', function() {
  this.constructor.calcAverageRating(this.shelterId);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;