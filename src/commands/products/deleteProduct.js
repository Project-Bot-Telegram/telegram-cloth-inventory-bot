const mongoose = require('mongoose');
const Product = require('../../models/Product');

module.exports = async (ctx) => {
  const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
  const parts = text.split(' ').filter(Boolean);

  // Usage: /deleteproduct <productId|_id>
  const id = parts[1];
  if (!id) return ctx.reply('Usage: /deleteproduct <productId>');

  let product = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findByIdAndDelete(id);
  }
  if (!product) {
    product = await Product.findOneAndDelete({ product_id: id });
  }

  if (!product) return ctx.reply('Product not found');

  ctx.reply('Product deleted');
};
