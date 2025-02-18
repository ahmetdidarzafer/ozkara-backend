const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  guestInfo: {
    name: String,
    email: String,
    phone: String
  },
  date: {
    type: Date,
    required: [true, 'Tarih alanı zorunludur']
  },
  time: {
    type: String,
    required: [true, 'Saat alanı zorunludur']
  },
  service: {
    type: String,
    required: [true, 'Hizmet alanı zorunludur']
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['Beklemede', 'Onaylandı', 'Tamamlandı'],
    default: 'Beklemede'
  },
  isGuest: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Tarih ve saat için index
appointmentSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
