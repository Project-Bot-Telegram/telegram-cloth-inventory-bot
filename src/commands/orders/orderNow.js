const path = require('path');
const mongoose = require('mongoose');
const { Markup } = require('telegraf');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { schedulePendingOrderExpiration } = require('../../utils/orderHelper');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const findProductById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return Product.findById(id).populate('category_id');
};

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || !callbackQuery.data.startsWith('order_now:')) {
    return;
  }

  const productId = callbackQuery.data.split(':')[1];
  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.', { show_alert: true });
    return;
  }

  const product = await findProductById(productId);
  if (!product) {
    await safeAnswerCbQuery(ctx, 'Product not found.', { show_alert: true });
    return;
  }

  const quantity = 1;
  if (product.quantity < quantity) {
    await safeAnswerCbQuery(ctx, 'Not enough stock.', { show_alert: true });
    return;
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

  await safeAnswerCbQuery(ctx);

  const qrPath = path.join(__dirname, '../../../assets/QRpayment/QRpayment.png');
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('Confirm payment', `confirm_order:${order._id}`)]
  ]);

  return ctx.replyWithPhoto({ source: qrPath }, {
    caption: `Payment and confirm \nwithin 2 minutes.\n\nOrder Summary:\nProduct: ${order.product_name}\nCategory: ${order.product_category}\nQuantity: ${order.quantity}\nPrice per item: $${order.product_price.toFixed(2)}\nTotal: $${order.total_price.toFixed(2)}`,
    reply_markup: buttons.reply_markup
  });
};
