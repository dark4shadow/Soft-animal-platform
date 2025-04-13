const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['cat', 'dog', 'mixed', 'clinic']
    },
    address: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    phone: String,
    email: String,
    description: String,
    fullDescription: String,
    workingHours: String,
    image: String,
    gallery: [String],
    animalsCount: {
      type: Number,
      default: 0
    },
    capacity: Number,
    foundedYear: Number,
    teamSize: Number,
    rating: {
      type: Number,
      default: 0
    },
    reviewsCount: {
      type: Number,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false
    },
    needsHelp: [String],
    donationGoal: {
      type: Number,
      default: 10000
    },
    donationCurrent: {
      type: Number,
      default: 0
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  {
    timestamps: true
  }
);

const Shelter = mongoose.model('Shelter', shelterSchema);
module.exports = Shelter;