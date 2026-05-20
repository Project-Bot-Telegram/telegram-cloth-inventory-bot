const mongoose = require('mongoose');
const { Markup } = require('telegraf');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');
const User = require('../../models/User');
const Product = require('../../models/Product');

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

  await safeAnswerCbQuery(ctx);

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
    `Choose delivery address for ${product.name}:`,
    buttons
  );
};
