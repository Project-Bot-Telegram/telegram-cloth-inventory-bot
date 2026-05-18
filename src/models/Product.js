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

  quantity: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model(
  'Product',
  productSchema
);