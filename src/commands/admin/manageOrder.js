const { Markup } = require('telegraf');
const Order = require('../../models/Order');
const User = require('../../models/User');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');
const { buildOrderMessage } = require('../orders/orderHistory');

const PAGE_SIZE = 4;
const STATUS_LABELS = {
  expired: 'Expired',
  confirmed: 'Confirmed',
  delivered: 'Delivered'
};

const buildOrderActionKeyboardRows = (order) => {
  const rows = [];
  if (order.status === 'confirmed') {
    rows.push([
      Markup.button.callback('❌expired', `admin_order_change:${order._id}:expired`),
      Markup.button.callback('✔delivered', `admin_order_change:${order._id}:delivered`)
    ]);
  }
  return rows.length ? rows : null;
};

const sendAdminOrderStatusPage = async (ctx, status, orders, startIndex, isCallback = false) => {
  const page = orders.slice(startIndex, startIndex + PAGE_SIZE);
  if (page.length === 0) {
    if (isCallback) {
      await safeAnswerCbQuery(ctx, `No ${STATUS_LABELS[status] || status} orders found.`);
    }
    return;
  }

  if (isCallback) {
    await safeAnswerCbQuery(ctx);
  }

  const remaining = orders.length - (startIndex + PAGE_SIZE);
  const pageKeyboardRows = remaining > 0
    ? [[Markup.button.callback(`See ${Math.min(PAGE_SIZE, remaining)} more`, `admin_order_status_more:${status}:${startIndex + PAGE_SIZE}`)]]
    : null;

  for (let idx = 0; idx < page.length; idx += 1) {
    const order = page[idx];
    const user = await User.findById(order.user_id);
    const orderText = buildOrderMessage(order, startIndex + idx, user || { full_name: 'Unknown' });
    const actionRows = buildOrderActionKeyboardRows(order);
    if (actionRows) {
      const keyboardRows = pageKeyboardRows && idx === page.length - 1
        ? actionRows.concat(pageKeyboardRows)
        : actionRows;
      await ctx.reply(orderText, Markup.inlineKeyboard(keyboardRows));
    } else if (idx === page.length - 1) {
      await ctx.reply(orderText, pageKeyboardRows ? Markup.inlineKeyboard(pageKeyboardRows) : undefined);
    } else {
      await ctx.reply(orderText);
    }
  }

  if (pageKeyboardRows && page.length === 0) {
    await ctx.reply('No orders found.');
  }
};

const showStatusMenu = async (ctx) => {
  return ctx.reply(
    '------------------------------\n' +
    'Manage Orders\n' +
    '------------------------------\n' +
    'Choose which order status to view:',
    Markup.inlineKeyboard([
      [Markup.button.callback('expired', 'admin_order_status:expired')],
      [Markup.button.callback('confirmed', 'admin_order_status:confirmed')],
      [Markup.button.callback('delivered', 'admin_order_status:delivered')]
    ])
  );
};

const handleCallback = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) return;

  await safeAnswerCbQuery(ctx);

  const parts = callbackQuery.data.split(':');
  const action = parts[0];
  let status = null;
  let orderId = null;
  let offset = 0;

  if (action === 'admin_order_status') {
    status = parts[1];
  } else if (action === 'admin_order_status_more') {
    status = parts[1];
    offset = parseInt(parts[2], 10);
  } else if (action === 'admin_order_change') {
    orderId = parts[1];
    status = parts[2];
  } else if (action === 'admin_order_change_confirm') {
    orderId = parts[1];
    status = parts[2];
  } else if (action === 'admin_order_change_cancel') {
    orderId = parts[1];
  }

  if (action === 'admin_order_status') {
    if (!STATUS_LABELS[status]) {
      return ctx.reply('Invalid order status selected.');
    }

    const orders = await Order.find({ status }).sort({ created_at: -1 });
    if (orders.length === 0) {
      return ctx.reply(`No ${STATUS_LABELS[status]} orders found.`);
    }

    return sendAdminOrderStatusPage(ctx, status, orders, 0);
  }

  if (action === 'admin_order_status_more') {
    if (!STATUS_LABELS[status]) {
      return ctx.reply('Invalid order status selection.');
    }

    const orders = await Order.find({ status }).sort({ created_at: -1 });
    if (orders.length === 0) {
      return ctx.reply(`No ${STATUS_LABELS[status]} orders found.`);
    }

    return sendAdminOrderStatusPage(ctx, status, orders, offset, true);
  }

  if (action === 'admin_order_change') {
    if (!['expired', 'delivered'].includes(status)) {
      return ctx.reply('Invalid order action selected.');
    }

    return ctx.reply(
      '------------------------------\n' +
      'Confirm Status Change\n' +
      '------------------------------\n' +
      `Change order ${orderId} to ${status === 'expired' ? '❌expired' : '✔delivered'}?`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('No', `admin_order_change_cancel:${orderId}`),
          Markup.button.callback('Yes', `admin_order_change_confirm:${orderId}:${status}`)
        ]
      ])
    );
  }

  if (action === 'admin_order_change_confirm') {
    const orderId = parts[1];
    const newStatus = parts[2];
    if (!['expired', 'delivered'].includes(newStatus)) {
      return ctx.reply('Invalid status change.');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return ctx.reply('Order not found.');
    }

    order.status = newStatus;
    await order.save();

    return ctx.reply(`Order ${orderId} status changed to ${STATUS_LABELS[newStatus]}.`);
  }

  if (action === 'admin_order_change_cancel') {
    return ctx.reply('Order status change canceled.');
  }

  return false;
};

module.exports = {
  showStatusMenu,
  handleCallback
};
