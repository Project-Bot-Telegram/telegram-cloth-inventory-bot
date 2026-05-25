const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegram_id: {
    type: Number,
    required: true,
    unique: true
  },
  username: String,
  full_name: String,
  phone_number: String,
  address: String,
  role: {
    type: String,
    default: 'staff'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
