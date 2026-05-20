const { safeAnswerCbQuery } = require('../../utils/telegramHelper');
const User = require('../../models/User');
const handlePendingOrderAddress = require('./handlePendingOrderAddress');

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || !callbackQuery.data.startsWith('order_address:')) {
    return;
  }

  const choice = callbackQuery.data.split(':')[1];
  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.', { show_alert: true });
    return;
  }

  const pendingOrder = ctx.session && ctx.session.pendingOrder;
  if (!pendingOrder) {
    await safeAnswerCbQuery(ctx, 'No pending order found. Please place an order first.', { show_alert: true });
    return;
  }

  if (choice === 'profile') {
    if (!user.address) {
      await safeAnswerCbQuery(ctx);
      return ctx.reply('Your profile does not have a saved delivery address. Please send your delivery address now.');
    }

    await safeAnswerCbQuery(ctx);
    return handlePendingOrderAddress.finalizePendingOrder(ctx, user, user.address);
  }

  if (choice === 'new') {
    await safeAnswerCbQuery(ctx);
    return ctx.reply('Please send your delivery address to continue.');
  }

  await safeAnswerCbQuery(ctx, 'Invalid address option.', { show_alert: true });
};
