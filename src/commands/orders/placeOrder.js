const mongoose = require('mongoose');
const { Markup } = require('telegraf');
const User = require('../../models/User');
const Product = require('../../models/Product');

const findProduct = async (identifier) => {
  let product = await Product.findOne({ name: identifier }).populate('category_id');
  if (product) return product;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier).populate('category_id');
    if (product) return product;
  }

  return Product.findOne({ product_id: identifier }).populate('category_id');
};

module.exports = async (ctx) => {
  const fullText = ctx.message.text.trim();
  const commandBody = fullText.slice(fullText.indexOf(' ') + 1).trim();

  if (!commandBody || commandBody.indexOf(' ') === -1) {
    return ctx.reply('Usage: /order <product_id|name> <quantity>');
  }

  const lastSpace = commandBody.lastIndexOf(' ');
  const identifier = commandBody.slice(0, lastSpace).trim();
  const quantityText = commandBody.slice(lastSpace + 1).trim();
  const quantity = parseInt(quantityText, 10);

  if (!identifier || Number.isNaN(quantity) || quantity < 1) {
    return ctx.reply('Usage: /order <product_id|name> <quantity>');
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    return ctx.reply('Please register first by sending /start.');
  }

  const product = await findProduct(identifier);
  if (!product) {
    return ctx.reply('Product not found.');
  }

  if (product.quantity < quantity) {
    return ctx.reply(`Not enough stock. Available quantity: ${product.quantity}`);
  }

  ctx.session = ctx.session || {};
  ctx.session.pendingOrder = {
    type: 'single',
    productId: product._id.toString(),
    productName: product.name,
    productCategory: product.category_id ? product.category_id.name : 'Uncategorized',
    productPrice: product.price || 0,
    quantity,
    totalPrice: (product.price || 0) * quantity
  };

  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('Use profile address', 'order_address:profile')],
    [Markup.button.callback('Use new address', 'order_address:new')]
  ]);

  return ctx.reply(
    `Choose delivery address for ${product.name} x${quantity}:`,
    buttons
  );
};
