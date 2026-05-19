const mongoose = require('mongoose');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const { clearPendingOrderExpiration } = require('../../utils/orderHelper');

const findProductById = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) return null;
  return Product.findById(productId);
};

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) {
    return;
  }

  const data = callbackQuery.data;
  if (!data.startsWith('confirm_order:')) {
    return;
  }

  const orderId = data.split(':')[1];
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    await ctx.answerCbQuery('Invalid order confirmation.');
    return;
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await ctx.answerCbQuery('Please register first by sending /start.', { show_alert: true });
    return;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    await ctx.answerCbQuery('Order not found.', { show_alert: true });
    return;
  }

  if (!order.user_id.equals(user._id)) {
    await ctx.answerCbQuery('This order belongs to another user.', { show_alert: true });
    return;
  }

  if (order.status !== 'pending') {
    const message = order.status === 'confirmed'
      ? 'This order is already confirmed.'
      : 'This order is no longer pending.';
    await ctx.answerCbQuery(message, { show_alert: true });
    return;
  }

  if (order.expires_at && order.expires_at < new Date()) {
    order.status = 'expired';
    await order.save();
    clearPendingOrderExpiration(orderId);

    const expiredProduct = await findProductById(order.product_id);
    if (expiredProduct) {
      expiredProduct.quantity += order.quantity;
      await expiredProduct.save();
    }

    await ctx.answerCbQuery('Order has expired. Please place a new order.', { show_alert: true });
    return;
  }

  order.status = 'confirmed';
  await order.save();
  clearPendingOrderExpiration(orderId);

  await ctx.answerCbQuery('Payment confirmed!');
  await ctx.reply(`✅ Order confirmed!\n\nProduct: ${order.product_name}\nCategory: ${order.product_category}\nQuantity: ${order.quantity}\nTotal: $${order.total_price.toFixed(2)}\nStatus: confirmed`);
};
