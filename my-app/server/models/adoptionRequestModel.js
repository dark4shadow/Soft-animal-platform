const mongoose = require('mongoose');

const AdoptionRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  animal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: true
  },
  shelter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shelter',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  contactPhone: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  rejectionReason: {
    type: String,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdoptionRequest', AdoptionRequestSchema);