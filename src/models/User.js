const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegram_id: Number,
  username: String,
  full_name: String,
  language: String,
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