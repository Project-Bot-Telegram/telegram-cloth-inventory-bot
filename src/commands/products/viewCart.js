const { Markup } = require('telegraf');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const formatCartItem = (item) => {
  const productPrice = typeof item.productPrice === 'number' ? item.productPrice : 0;
  const totalPrice = (productPrice * item.quantity).toFixed(2);
  return `product: ${item.productName}\nquantity: ${item.quantity}\nprice: $${totalPrice}`;
};

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  const isCallback = callbackQuery && callbackQuery.data && callbackQuery.data.startsWith('view_cart');
  const isCommand = ctx.message && ctx.message.text && ctx.message.text.trim().startsWith('/cart');

  if (!isCallback && !isCommand) {
    return;
  }

  ctx.session = ctx.session || {};
  const cart = ctx.session.cart || [];

  if (cart.length === 0) {
    if (isCallback) {
      await safeAnswerCbQuery(ctx, 'Your cart is empty.', { show_alert: true });
      return;
    }
    return ctx.reply('Your cart is empty.');
  }

  if (isCallback) {
    await safeAnswerCbQuery(ctx);
  }

  let message = '' +
    '------------------------------\n' +
    'Cart\n' +
    '------------------------------\n';
  for (const item of cart) {
    message += `${formatCartItem(item)}\n`;
    message += '------------------------------\n';
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Order all product', 'order_all_cart')],
    [Markup.button.callback('Clear cart', 'clear_cart')]
  ]);

  return ctx.reply(message, keyboard);
};
