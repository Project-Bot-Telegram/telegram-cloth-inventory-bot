const mongoose = require('mongoose');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const { clearPendingOrderExpiration } = require('../../utils/orderHelper');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

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
    await safeAnswerCbQuery(ctx, 'Invalid order confirmation.');
    return;
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.', { show_alert: true });
    return;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    await safeAnswerCbQuery(ctx, 'Order not found.', { show_alert: true });
    return;
  }

  if (!order.user_id.equals(user._id)) {
    await safeAnswerCbQuery(ctx, 'This order belongs to another user.', { show_alert: true });
    return;
  }

  if (order.status !== 'pending') {
    const message = order.status === 'confirmed'
      ? 'This order is already confirmed.'
      : 'This order is no longer pending.';
    await safeAnswerCbQuery(ctx, message, { show_alert: true });
    return;
  }

  if (order.expires_at && order.expires_at < new Date()) {
    order.status = 'expired';
    await order.save();
    clearPendingOrderExpiration(orderId);

    if (order.cart_items && order.cart_items.length > 0) {
      for (const item of order.cart_items) {
        if (!item.product_id) continue;
        const expiredProduct = await findProductById(item.product_id);
        if (expiredProduct) {
          expiredProduct.quantity += item.quantity;
          await expiredProduct.save();
        }
      }
    } else {
      const expiredProduct = await findProductById(order.product_id);
      if (expiredProduct) {
        expiredProduct.quantity += order.quantity;
        await expiredProduct.save();
      }
    }

    await safeAnswerCbQuery(ctx, 'Order has expired. Please place a new order.', { show_alert: true });
    return;
  }

  order.status = 'confirmed';
  await order.save();
  clearPendingOrderExpiration(orderId);

  await safeAnswerCbQuery(ctx, 'Payment confirmed!');

  if (order.cart_items && order.cart_items.length > 0) {
    const cartSummary = order.cart_items.map((item) => `- ${item.product_name} x${item.quantity} = $${item.total_price.toFixed(2)}`).join('\n');
    await ctx.reply(`✅ Order confirmed!\n\nCart order:\n${cartSummary}\n\nTotal: $${order.total_price.toFixed(2)}\nStatus: confirmed`);
  } else {
    await ctx.reply(`✅ Order confirmed!\n\nProduct: ${order.product_name}\nCategory: ${order.product_category}\nQuantity: ${order.quantity}\nTotal: $${order.total_price.toFixed(2)}\nStatus: confirmed`);
  }
};
