const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || !callbackQuery.data.startsWith('clear_cart')) {
    return;
  }

  ctx.session = ctx.session || {};
  ctx.session.cart = [];

  await safeAnswerCbQuery(ctx, 'Cart cleared.');
  await ctx.reply('✅ Your cart has been cleared.');
};
