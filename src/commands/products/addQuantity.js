const mongoose = require('mongoose');
const Product = require('../../models/Product');

module.exports = async (ctx) => {
  const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
  const parts = text.split(' ').filter(Boolean);

  // Usage: /addquantity <productId|_id> <amount>
  if (parts.length !== 3) {
    return ctx.reply('Usage: /addquantity <productId> <amount>');
  }

  const productId = parts[1];
  const amount = parseInt(parts[2], 10);

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply('Invalid amount. Provide a positive integer.');
  }

  // Accept either human-friendly `product_id` or Mongo `_id`
  let product = null;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    product = await Product.findById(productId);
  }
  if (!product) {
    product = await Product.findOne({ product_id: productId });
  }
  if (!product) return ctx.reply('Product not found');

  product.quantity = (typeof product.quantity === 'number' ? product.quantity : 0) + amount;
  await product.save();

  let status = 'Out of stock';
  if (product.quantity === 0) status = 'Out of stock';
  else if (product.quantity > 5) status = 'In stock';
  else if (product.quantity > 0 && product.quantity < 5) status = 'Low stock';

  ctx.reply(`Quantity updated. Product: ${product.name}\nID: ${product._id}\nQuantity: ${product.quantity}\nStatus: ${status}`);
};
