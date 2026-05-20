const path = require('path');
const mongoose = require('mongoose');
const { Markup } = require('telegraf');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { schedulePendingOrderExpiration } = require('../../utils/orderHelper');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const findProductById = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) return null;
  return Product.findById(productId).populate('category_id');
};

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || !callbackQuery.data.startsWith('order_all_cart')) {
    return;
  }

  ctx.session = ctx.session || {};
  const cart = ctx.session.cart || [];

  if (cart.length === 0) {
    await safeAnswerCbQuery(ctx, 'Your cart is empty.', { show_alert: true });
    return;
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.', { show_alert: true });
    return;
  }

  const insufficientItems = [];
  const products = [];

  for (const item of cart) {
    const product = await findProductById(item.productId);
    if (!product) {
      insufficientItems.push(`Product ${item.productName} not found.`);
      continue;
    }

    if (product.quantity < item.quantity) {
      insufficientItems.push(`${product.name} only has ${product.quantity} available.`);
    }

    products.push({ product, requestedQuantity: item.quantity });
  }

  if (insufficientItems.length > 0) {
    await safeAnswerCbQuery(ctx);
    return ctx.reply(`Unable to place order for all cart items:\n${insufficientItems.join('\n')}`);
  }

  await safeAnswerCbQuery(ctx);

  const totalQuantity = products.reduce((sum, item) => sum + item.requestedQuantity, 0);
  const totalPrice = products.reduce((sum, item) => sum + ((item.product.price || 0) * item.requestedQuantity), 0);
  const cartItems = products.map(({ product, requestedQuantity }) => {
    const productCategory = product.category_id
      ? product.category_id.name
      : 'Uncategorized';

    return {
      product_id: product._id,
      product_name: product.name,
      product_category: productCategory,
      product_price: product.price || 0,
      quantity: requestedQuantity,
      total_price: (product.price || 0) * requestedQuantity
    };
  });

  for (const { product, requestedQuantity } of products) {
    product.quantity -= requestedQuantity;
    await product.save();
  }

  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
  const productCategories = [...new Set(cartItems.map((item) => item.product_category))];
  const order = new Order({
    telegram_id: user.telegram_id,
    user_id: user._id,
    product_name: 'Cart order',
    product_category: productCategories.join(', '),
    product_price: totalPrice,
    quantity: totalQuantity,
    total_price: totalPrice,
    cart_items: cartItems,
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

    for (const item of pendingOrder.cart_items || []) {
      if (!item.product_id) continue;
      const expiredProduct = await Product.findById(item.product_id);
      if (expiredProduct) {
        expiredProduct.quantity += item.quantity;
        await expiredProduct.save();
      }
    }

    await ctx.telegram.sendMessage(ctx.from.id, `⏰ Your cart order has expired. Payment was not confirmed within 2 minutes and stock was restored.`);
  });

  const qrPath = path.join(__dirname, '../../../assets/QRpayment/QRpayment.png');
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('Confirm payment', `confirm_order:${order._id}`)]
  ]);

  ctx.session.cart = [];
  await ctx.reply('✅ All cart items have been ordered. Please confirm the single pending payment.');

  const summaryLines = cartItems.map((item) => `- ${item.product_name} x${item.quantity} = $${item.total_price.toFixed(2)}`);
  await ctx.replyWithPhoto({ source: qrPath }, {
    caption: `Payment and confirm \nwithin 2 minutes.\n\nOrder Summary:\n${summaryLines.join('\n')}\n\nTotal: $${totalPrice.toFixed(2)}`,
    reply_markup: buttons.reply_markup
  });
};
