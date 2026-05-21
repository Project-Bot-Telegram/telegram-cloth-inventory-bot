const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,

  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },

  product_id: {
    type: String,
    unique: true,
    sparse: true
  },

  supplier_id: String,

  price: Number,

  description: String,

  image: String,

  quantity: {
    type: Number,
    default: 0
  },
  stock_history: {
    type: [
      new mongoose.Schema({
        date: {
          type: Date,
          default: Date.now
        },
        change: Number,
        from: Number,
        to: Number,
        type: String
      }, { _id: false })
    ],
    default: []
  }
});

module.exports = mongoose.model(
  'Product',
  productSchema
);