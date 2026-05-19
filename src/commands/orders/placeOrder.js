const path = require('path');
const mongoose = require('mongoose');
const { Markup } = require('telegraf');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { schedulePendingOrderExpiration } = require('../../utils/orderHelper');

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

  product.quantity -= quantity;
  await product.save();

  const productCategory = product.category_id
    ? product.category_id.name
    : 'Uncategorized';

  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
  const order = new Order({
    telegram_id: user.telegram_id,
    user_id: user._id,
    product_id: product._id,
    product_name: product.name,
    product_category: productCategory,
    product_price: product.price || 0,
    quantity,
    total_price: (product.price || 0) * quantity,
    expires_at: expiresAt
  });

  await order.save();

  schedulePendingOrderExpiration(order._id, expiresAt, async () => {
    const pendingOrder = await Order.findById(order._id);
    if (!pendingOrder || pendingOrder.status !== 'pending') {
      return;
    }

    pendingOrder.status = 'expired';
    await pendingOrder.save();

    const originalProduct = await Product.findById(product._id);
    if (originalProduct) {
      originalProduct.quantity += quantity;
      await originalProduct.save();
    }

    await ctx.telegram.sendMessage(ctx.from.id, `⏰ Your order for ${product.name} has expired. Payment was not confirmed within 2 minutes and stock was restored.`);
  });

  const qrPath = path.join(__dirname, '../../../assets/QRpayment/QRpayment.png');
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('Confirm payment', `confirm_order:${order._id}`)]
  ]);

  return ctx.replyWithPhoto({ source: qrPath }, {
    caption: `Payment and confirm \nwithin 2 minutes.\n\nOrder Summary:\nProduct: ${order.product_name}\nCategory: ${order.product_category}\nQuantity: ${order.quantity}\nPrice per item: $${order.product_price.toFixed(2)}\nTotal: $${order.total_price.toFixed(2)}`,
    reply_markup: buttons.reply_markup
  });
};
