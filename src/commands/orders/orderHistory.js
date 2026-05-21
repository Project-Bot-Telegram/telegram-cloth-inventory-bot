const { Markup } = require('telegraf');
const Order = require('../../models/Order');
const User = require('../../models/User');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const PAGE_SIZE = 4;
const STATUS_LABELS = {
  expired: 'Expired',
  confirmed: 'Confirmed',
  delivered: 'Delivered'
};

const buildOrderMessage = (order, index, user) => {
  const createdAt = order.created_at
    ? order.created_at.toLocaleString()
    : 'Unknown date';
  const status = order.status === 'pending' && order.expires_at && order.expires_at < new Date()
    ? 'expired'
    : order.status;
  const expiresText = order.status === 'pending' && order.expires_at
    ? ` (expires ${order.expires_at.toLocaleTimeString()})`
    : '';

  let orderText = '------------------------------\n';
  orderText += `Order #${index + 1}\n`;
  orderText += '------------------------------\n';

  if (order.cart_items && order.cart_items.length > 0) {
    const cartLines = order.cart_items
      .map((item) => `Product: ${item.product_name}\nCategory: ${item.product_category}\nQuantity: ${item.quantity}\nPrice: $${item.product_price.toFixed(2)}\nTotal: $${item.total_price.toFixed(2)}`)
      .join('\n------------------------------\n');
    orderText += `${cartLines}\n`;
  } else {
    orderText += `Product: ${order.product_name}\nCategory: ${order.product_category}\nQuantity: ${order.quantity}\nPrice: $${order.product_price.toFixed(2)}\nTotal: $${order.total_price.toFixed(2)}\n`;
  }

  orderText += '------------------------------\n';
  orderText += `Total Payment: $${order.total_price.toFixed(2)}\n`;
  orderText += `Full Name: ${user.full_name || 'N/A'}\n`;
  orderText += `Address: ${order.address || 'N/A'}\n`;
  orderText += `Status: ${status}${expiresText}\n`;
  orderText += `Date: ${createdAt}\n`;
  orderText += '------------------------------';

  return orderText;
};

const sendOrderHistoryPage = async (ctx, user, orders, startIndex, status = null, isCallback = false) => {
  const page = orders.slice(startIndex, startIndex + PAGE_SIZE);
  if (page.length === 0) {
    if (isCallback) {
      await safeAnswerCbQuery(ctx, `No more ${status ? STATUS_LABELS[status] : ''} order history to show.`);
    }
    return;
  }

  if (isCallback) {
    await safeAnswerCbQuery(ctx);
  }

  const remaining = orders.length - (startIndex + PAGE_SIZE);
  const keyboard = remaining > 0
    ? Markup.inlineKeyboard([
      [Markup.button.callback(`See ${Math.min(PAGE_SIZE, remaining)} more`, `order_history_more:${status || 'all'}:${startIndex + PAGE_SIZE}`)]
    ])
    : null;

  for (let idx = 0; idx < page.length; idx += 1) {
    const order = page[idx];
    const orderText = buildOrderMessage(order, startIndex + idx, user);
    const replyOptions = idx === page.length - 1 ? keyboard : undefined;
    await ctx.reply(orderText, replyOptions);
  }
};

const showOrderStatusMenu = async (ctx) => {
  return ctx.reply(
    '------------------------------\n' +
    'Order History\n' +
    '------------------------------\n' +
    'Choose a status to view:',
    Markup.inlineKeyboard([
      [Markup.button.callback('expired', 'order_history_status:expired')],
      [Markup.button.callback('confirmed', 'order_history_status:confirmed')],
      [Markup.button.callback('delivered', 'order_history_status:delivered')]
    ])
  );
};

const orderHistoryCommand = async (ctx) => {
  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    return ctx.reply('Please register first by sending /start.');
  }

  return showOrderStatusMenu(ctx);
};

orderHistoryCommand.handleStatus = async (ctx) => {
  const callbackData = ctx.callbackQuery && ctx.callbackQuery.data;
  if (!callbackData) {
    return;
  }

  const [, status] = callbackData.split(':');
  if (!STATUS_LABELS[status]) {
    await safeAnswerCbQuery(ctx, 'Invalid status selection.');
    return;
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.');
    return;
  }

  const orders = await Order.find({ user_id: user._id, status }).sort({ created_at: -1 });
  if (orders.length === 0) {
    return ctx.reply(`No ${STATUS_LABELS[status]} orders found.`);
  }

  return sendOrderHistoryPage(ctx, user, orders, 0, status);
};

orderHistoryCommand.handleMore = async (ctx) => {
  const callbackData = ctx.callbackQuery && ctx.callbackQuery.data;
  if (!callbackData) {
    return;
  }

  const parts = callbackData.split(':');
  let status = null;
  let offsetString = null;

  if (parts.length === 2) {
    offsetString = parts[1];
  } else {
    status = parts[1] === 'all' ? null : parts[1];
    offsetString = parts[2];
  }

  const offset = parseInt(offsetString, 10);
  if (Number.isNaN(offset) || offset < 0) {
    await safeAnswerCbQuery(ctx, 'Invalid history page.');
    return;
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.');
    return;
  }

  const query = { user_id: user._id };
  if (status) query.status = status;

  const orders = await Order.find(query).sort({ created_at: -1 });

  if (orders.length === 0) {
    await safeAnswerCbQuery(ctx, `No ${status ? STATUS_LABELS[status] : ''} order history found.`);
    return;
  }

  await sendOrderHistoryPage(ctx, user, orders, offset, status, true);
};

module.exports = orderHistoryCommand;
module.exports.buildOrderMessage = buildOrderMessage;
module.exports.handleStatus = orderHistoryCommand.handleStatus;

