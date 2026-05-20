const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  product_name: {
    type: String,
    required: true
  },
  product_category: String,
  product_price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  cart_items: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      product_name: String,
      product_category: String,
      product_price: Number,
      quantity: Number,
      total_price: Number
    }
  ],
  telegram_id: {
    type: Number,
    required: true
  },
  total_price: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'pending'
  },
  expires_at: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
