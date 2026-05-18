const mongoose = require('mongoose');
const Product = require('../../models/Product');
const Category = require('../../models/Category');

module.exports = async (ctx) => {
  const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
  const parts = text.split(' ').filter(Boolean);

  // Usage: /editproduct <productId|_id> <field> <newValue>
  const productId = parts[1];
  const field = parts[2];
  const newValue = parts.slice(3).join(' ');

  if (!productId || !field || !newValue) {
    return ctx.reply('Usage: /editproduct <productId> <field(name|category|price|quantity|description)> <newValue>');
  }

  // Accept either human-friendly product_id or Mongo _id
  let product = null;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    product = await Product.findById(productId);
  }
  if (!product) {
    product = await Product.findOne({ product_id: productId });
  }
  if (!product) return ctx.reply('Product not found');

  if (field === 'name') {
    product.name = newValue;
  } else if (field === 'category') {
    const category = await Category.findOne({ name: newValue });
    if (!category) return ctx.reply('Category not found');
    product.category_id = category._id;
  } else if (field === 'price') {
    const price = parseFloat(newValue);
    if (isNaN(price)) return ctx.reply('Invalid price');
    product.price = price;
  } else if (field === 'quantity') {
    const qty = parseInt(newValue, 10);
    if (isNaN(qty) || qty < 0) return ctx.reply('Invalid quantity');
    product.quantity = qty;
  } else if (field === 'description') {
    product.description = newValue;
  } else {
    return ctx.reply('Unknown field. Allowed: name, category, price, quantity, description');
  }

  await product.save();
  ctx.reply('Product updated');
};
