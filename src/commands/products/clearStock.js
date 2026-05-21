const mongoose = require('mongoose');
const Product = require('../../models/Product');

const getStockStatus = (quantity) => {
  if (quantity === 0) return 'Out of stock';
  if (quantity > 5) return 'In stock';
  return 'Low stock';
};

const findProduct = async (productId) => {
  let product = null;
  if (mongoose.Types.ObjectId.isValid(productId)) {
    product = await Product.findById(productId);
  }
  if (!product) {
    product = await Product.findOne({ product_id: productId });
  }
  return product;
};

module.exports = async (ctx) => {
  const text = (ctx.message && ctx.message.text) ? ctx.message.text.trim() : '';
  const parts = text.split(' ').filter(Boolean);

  if (parts.length !== 2) {
    return ctx.reply('Usage: /clearstock <productId>');
  }

  const productId = parts[1];
  const product = await findProduct(productId);
  if (!product) return ctx.reply('Product not found');

  const currentQuantity = typeof product.quantity === 'number' ? product.quantity : 0;
  product.quantity = 0;
  if (!Array.isArray(product.stock_history)) {
    product.stock_history = (product.stock_history && typeof product.stock_history === 'object') ? [product.stock_history] : [];
  }
  product.stock_history.push({
    date: new Date(),
    change: -currentQuantity,
    from: currentQuantity,
    to: 0,
    type: 'clear'
  });
  if (product.stock_history.length > 20) {
    product.stock_history = product.stock_history.slice(-20);
  }
  await product.save();

  const status = getStockStatus(product.quantity);
  const displayId = product.product_id || String(product._id);
  ctx.reply(`Stock cleared. Product: ${product.name}\nID: ${displayId}\nQuantity: ${product.quantity}\nStatus: ${status}`);
};