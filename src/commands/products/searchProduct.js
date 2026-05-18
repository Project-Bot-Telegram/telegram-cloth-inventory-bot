const Product = require('../../models/Product');
const Category = require('../../models/Category');
const mongoose = require('mongoose');

const formatProduct = (product) => {
  const categoryName = product.category_id ? product.category_id.name : 'Uncategorized';
  const price = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
  const quantity = typeof product.quantity === 'number' ? product.quantity : 0;
  let status = 'Out of stock';
  if (quantity > 5) status = 'In stock';
  else if (quantity > 0) status = 'Low stock';

  return `ID: ${product.product_id || product._id}\nName: ${product.name}\nCategory: ${categoryName}\nPrice: $${price}\nQuantity: ${quantity}\nStatus: ${status}`;
};

module.exports = async (ctx) => {
  const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
  const parts = text.split(' ').filter(Boolean);
  const type = parts[1];
  const query = parts.slice(2).join(' ');

  if (!type || !query) {
    return ctx.reply('Usage: /search <id|name|category|price> <query>');
  }

  let products = [];

  if (type === 'id') {
    if (mongoose.Types.ObjectId.isValid(query)) {
      const product = await Product.findById(query).populate('category_id');
      if (product) products.push(product);
    }
    if (products.length === 0) {
      const product = await Product.findOne({ product_id: query }).populate('category_id');
      if (product) products.push(product);
    }
  } else if (type === 'name') {
    products = await Product.find({ name: query }).populate('category_id');
  } else if (type === 'category') {
    const category = await Category.findOne({ name: query });
    if (category) {
      products = await Product.find({ category_id: category._id }).populate('category_id');
    }
  } else if (type === 'price') {
    const price = parseFloat(query);
    if (!isNaN(price)) {
      products = await Product.find({ price }).populate('category_id');
    }
  } else {
    return ctx.reply('Unknown search type. Use id, name, category, or price.');
  }

  if (!products || products.length === 0) {
    return ctx.reply('No products found');
  }

  const lines = products.map(formatProduct).join('\n\n');
  ctx.reply(`Search results (${products.length}):\n\n${lines}`);
};
