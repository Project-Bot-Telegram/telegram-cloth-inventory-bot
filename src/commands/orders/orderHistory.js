const { Markup } = require('telegraf');
const Order = require('../../models/Order');
const User = require('../../models/User');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const PAGE_SIZE = 4;
const STATUS_LABELS = {
  expired: 'ផុតកំណត់',
  confirmed: 'បានបញ្ជាក់',
  delivered: 'បានដឹកជញ្ជូន'
  ,pending: 'រងចាំ'
};

const buildOrderMessage = (order, index, user) => {
  const createdAt = order.created_at
    ? order.created_at.toLocaleString()
    : 'មិនមានកាលបរិច្ឆេទ';
  const status = order.status === 'pending' && order.expires_at && order.expires_at < new Date()
    ? 'expired'
    : order.status;
  const statusLabel = STATUS_LABELS[status] || status;
  const expiresText = order.status === 'pending' && order.expires_at
    ? ` (ផុតកំណត់ ${order.expires_at.toLocaleTimeString()})`
    : '';

  let orderText = '------------------------------\n';
  orderText += `ការបញ្ជាទិញ #${index + 1}\n`;
  orderText += '------------------------------\n';

  if (order.cart_items && order.cart_items.length > 0) {
    const cartLines = order.cart_items
      .map((item) => `ផលិតផល: ${item.product_name}\nប្រភេទ: ${item.product_category}\nបរិមាណ: ${item.quantity}\nតម្លៃ: $${item.product_price.toFixed(2)}\nសរុប: $${item.total_price.toFixed(2)}`)
      .join('\n------------------------------\n');
    orderText += `${cartLines}\n`;
  } else {
    orderText += `ផលិតផល: ${order.product_name}\nប្រភេទ: ${order.product_category}\nបរិមាណ: ${order.quantity}\nតម្លៃ: $${order.product_price.toFixed(2)}\nសរុប: $${order.total_price.toFixed(2)}\n`;
  }

  orderText += '------------------------------\n';
  orderText += `សរុបតម្លៃទូទាត់: $${order.total_price.toFixed(2)}\n`;
  orderText += `ឈ្មោះពេញ: ${user.full_name || 'មិនមាន'}\n`;
  orderText += `អាសយដ្ឋាន: ${order.address || 'មិនមាន'}\n`;
  orderText += `ស្ថានភាព: ${statusLabel}${expiresText}\n`;
  orderText += `កាលបរិច្ឆេទ: ${createdAt}\n`;
  orderText += '------------------------------';

  return orderText;
};

const sendOrderHistoryPage = async (ctx, user, orders, startIndex, status = null, isCallback = false) => {
  const page = orders.slice(startIndex, startIndex + PAGE_SIZE);
  if (page.length === 0) {
    if (isCallback) {
      await safeAnswerCbQuery(ctx, `មិនមានប្រវត្តិការបញ្ជាទិញ ${status ? STATUS_LABELS[status] : ''} បន្ថែមទៀតទេ។`);
    }
    return;
  }

  if (isCallback) {
    await safeAnswerCbQuery(ctx);
  }

  const remaining = orders.length - (startIndex + PAGE_SIZE);
  const keyboard = remaining > 0
    ? Markup.inlineKeyboard([
      [Markup.button.callback(`មើលបន្ថែម ${Math.min(PAGE_SIZE, remaining)}`, `order_history_more:${status || 'all'}:${startIndex + PAGE_SIZE}`)]
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
    'ប្រវត្តិការបញ្ជាទិញ\n' +
    '------------------------------\n' +
    'សូមជ្រើសស្ថានភាពដើម្បីមើល:',
    Markup.inlineKeyboard([
      [Markup.button.callback('ផុតកំណត់', 'order_history_status:expired')],
      [Markup.button.callback('បានបញ្ជាក់', 'order_history_status:confirmed')],
      [Markup.button.callback('បានដឹកជញ្ជូន', 'order_history_status:delivered')]
    ])
  );
};

const orderHistoryCommand = async (ctx) => {
  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    return ctx.reply('សូមចុះឈ្មោះជាមុនដោយផ្ញើ /start។');
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
    await safeAnswerCbQuery(ctx, 'ការជ្រើសស្ថានភាពមិនត្រឹមត្រូវ។');
    return;
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'សូមចុះឈ្មោះជាមុនដោយផ្ញើ /start។');
    return;
  }

  const orders = await Order.find({ user_id: user._id, status }).sort({ created_at: -1 });
  if (orders.length === 0) {
    return ctx.reply(`មិនមានការបញ្ជាទិញ ${STATUS_LABELS[status]} ទេ។`);
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
    await safeAnswerCbQuery(ctx, 'ទំព័រប្រវត្តិមិនត្រឹមត្រូវ។');
    return;
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'សូមចុះឈ្មោះជាមុនដោយផ្ញើ /start។');
    return;
  }

  const query = { user_id: user._id };
  if (status) query.status = status;

  const orders = await Order.find(query).sort({ created_at: -1 });

  if (orders.length === 0) {
    await safeAnswerCbQuery(ctx, `មិនមានប្រវត្តិការបញ្ជាទិញ ${status ? STATUS_LABELS[status] : ''} ទេ។`);
    return;
  }

  await sendOrderHistoryPage(ctx, user, orders, offset, status, true);
};

module.exports = orderHistoryCommand;
module.exports.buildOrderMessage = buildOrderMessage;
module.exports.handleStatus = orderHistoryCommand.handleStatus;

