const mongoose = require('mongoose');
const Product = require('../../models/Product');

const findProduct = async (identifier) => {
  let product = await Product.findOne({ name: identifier }).populate('category_id');
  if (product) return product;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier).populate('category_id');
    if (product) return product;
  }

  product = await Product.findOne({ product_id: identifier }).populate('category_id');
  return product;
};

module.exports = async (ctx) => {
  const text = ctx.message.text.split(' ');
  const identifier = text[1];

  if (!identifier) {
    return ctx.reply('Usage: /product <name|id>');
  }

  const product = await findProduct(identifier);
  if (!product) {
    return ctx.reply('Product not found');
  }

  const categoryName = product.category_id
    ? product.category_id.name
    : 'Uncategorized';
  const price = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
  const description = product.description || 'No description';
  const quantity = typeof product.quantity === 'number' ? product.quantity : 0;

  let status = 'Out of stock';
  if (quantity === 0) status = 'Out of stock';
  else if (quantity > 5) status = 'In stock';
  else if (quantity > 0 && quantity < 5) status = 'Low stock';

  const displayId = product.product_id || String(product._id);

  ctx.reply(`\nProduct Detail\n\nID: ${displayId}\nName: ${product.name}\nCategory: ${categoryName}\nPrice: $${price}\nQuantity: ${quantity}\nStatus: ${status}\nDescription: ${description}\n  `);
};