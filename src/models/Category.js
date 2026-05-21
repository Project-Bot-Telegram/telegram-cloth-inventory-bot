const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  edit_history: [
    {
      old_name: String,
      new_name: String,
      edited_at: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model(
  'Category',
  categorySchema
);