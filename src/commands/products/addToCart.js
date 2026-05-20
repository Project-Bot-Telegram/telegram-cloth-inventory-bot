const { Markup } = require('telegraf');
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const findProductById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return Product.findById(id);
};

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || !callbackQuery.data.startsWith('add_cart:')) {
    return;
  }

  const productId = callbackQuery.data.split(':')[1];
  const product = await findProductById(productId);
  if (!product) {
    await safeAnswerCbQuery(ctx, 'Product not found.', { show_alert: true });
    return;
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.', { show_alert: true });
    return;
  }

  ctx.session = ctx.session || {};
  ctx.session.cart = ctx.session.cart || [];
  const existingItem = ctx.session.cart.find((item) => item.productId === String(product._id));

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    ctx.session.cart.push({
      productId: String(product._id),
      productName: product.name,
      productPrice: typeof product.price === 'number' ? product.price : 0,
      quantity: 1,
    });
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('View cart', 'view_cart')]
  ]);

  await safeAnswerCbQuery(ctx, 'Added to cart.');
  await ctx.reply(`✅ ${product.name} has been added to your cart.\nView product in cart:`, keyboard);
};
