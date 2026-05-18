const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegram_id: Number,
  username: String,
  first_name: String,
  last_name: String,
  language_code: String,
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