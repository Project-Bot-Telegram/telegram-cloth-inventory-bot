const mongoose = require('mongoose');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const { clearPendingOrderExpiration } = require('../../utils/orderHelper');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');
const { Markup } = require('telegraf');

const getShortOrderId = (id) => {
  try {
    const hex = id.toString();
    const last6 = hex.slice(-6);
    const num = parseInt(last6, 16);
    return num.toString().padStart(8, '0');
  } catch (e) {
    return id.toString();
  }
};

const maskFullName = (name) => {
  if (!name) return 'N/A';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'N/A';
  if (parts.length === 1) {
    const w = parts[0];
    if (w.length <= 2) return '*'.repeat(w.length);
    const first = w.slice(0, 2);
    const rest = '*'.repeat(w.length - 2);
    return `${first}${rest}`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  const firstMasked = first.length <= 2 ? '*'.repeat(first.length) : `${first.slice(0,2)}${'*'.repeat(Math.max(1, first.length - 2))}`;
  const lastMasked = last.length <= 2 ? '*'.repeat(last.length) : `${'*'.repeat(Math.max(0, last.length - 2))}${last.slice(-2)}`;
  // keep middle names fully masked
  const middleMasked = parts.slice(1, -1).map((w) => '*'.repeat(w.length)).join(' ');
  return [firstMasked, middleMasked, lastMasked].filter(Boolean).join(' ').replace(/\s+/g, ' ');
};

const maskTelegramId = (id) => {
  if (id === undefined || id === null) return 'N/A';
  const s = String(id);
  if (s.length <= 4) return '*'.repeat(s.length);
  return `${s.slice(0,2)}${'*'.repeat(Math.max(0, s.length - 4))}${s.slice(-2)}`;
};

const maskUsername = (u) => {
  if (!u) return 'N/A';
  const s = String(u);
  if (s.length <= 2) return '*'.repeat(s.length);
  return `${s.slice(0,2)}${'*'.repeat(Math.max(1, s.length - 4))}${s.slice(-2)}`;
};

const findProductById = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) return null;
  return Product.findById(productId);
};

const notifyAdminsAboutConfirmedOrder = async (ctx, order, buyer) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const buyerName = buyer.full_name || buyer.username || 'N/A';
    

    const maskName = (name) => {
      if (!name) return 'N/A';
      return name.split(' ').map((word) => {
        if (word.length <= 2) return '*'.repeat(word.length);
        const first = word.slice(0, 2);
        const last = word.length > 4 ? word.slice(-2) : '';
        const middleLen = word.length - (last ? 4 : 2);
        const middle = '*'.repeat(Math.max(middleLen, 1));
        return last ? `${first}${middle}${last}` : `${first}${middle}`;
      }).join(' ');
    };
    const summary = order.cart_items && order.cart_items.length > 0
      ? order.cart_items.map((item) => `- ${item.product_name} x${item.quantity} = $${item.total_price.toFixed(2)}`).join('\n')
      : `ផលិតផល: ${order.product_name}\nប្រភេទ: ${order.product_category}\nបរិមាណ: ${order.quantity}`;

    const message = '' +
      '✅ New Order Confirmed\n\n' +
      '------------------------------\n' +
      `អ្នកទិញ: ${buyerName}\n` +
      `Telegram ID: ${buyer.telegram_id || 'N/A'}\n` +
      `ឈ្មោះអ្នកប្រើប្រាស់: ${buyer.username || 'N/A'}\n` + 
      `អាសយដ្ឋាន: ${order.address || 'N/A'}\n` +
      '------------------------------\n' +
      `លេខកូដបញ្ជាទិញ: ${getShortOrderId(order._id)}\n` +
      '------------------------------\n' +
      `សង្ខេបការបញ្ជាទិញ:\n${summary}\n` +
      `ស្ថានភាព: Confirmed\n` +
      '------------------------------\n' +
      `សរុប: $${order.total_price.toFixed(2)}\n` +
      '------------------------------';

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('❌ផុតកំណត់', `admin_order_change:${order._id}:expired`),
        Markup.button.callback('✔បានដឹកជញ្ជូន', `admin_order_change:${order._id}:delivered`)
      ]
    ]);

    await Promise.all(admins
      .filter((admin) => admin.telegram_id && admin.telegram_id !== buyer.telegram_id)
      .map((admin) => ctx.telegram.sendMessage(admin.telegram_id, message, {
        reply_markup: keyboard.reply_markup
      })));

    // Also post the order to a dedicated channel if configured
    const channelId = process.env.ORDER_CHANNEL_ID;
    if (channelId) {
      try {
            const botInfo = ctx.botInfo || await ctx.telegram.getMe();
            const botLink = botInfo && botInfo.username
              ? `https://t.me/${botInfo.username}`
              : (process.env.BOT_USERNAME ? `https://t.me/${process.env.BOT_USERNAME}` : 'https://t.me/');

            const channelMessage = '' +
              '✅ New Order Confirmed\n\n' +
              '------------------------------\n' +
              `ឈ្មោះពេញ: ${maskFullName(buyerName)}\n` +
              `Telegram ID: ${maskTelegramId(buyer.telegram_id || '')}\n` +
              `ឈ្មោះអ្នកប្រើប្រាស់: ${maskUsername(buyer.username || '')}\n` +
              `អាសយដ្ឋាន: ${order.address ? '*****' : 'N/A'}\n` +
              '------------------------------\n' +
              `លេខកូដបញ្ជាទិញ: ${getShortOrderId(order._id)}\n` +
              '------------------------------\n' +
              `សង្ខេបការបញ្ជាទិញ:\n${summary}\n` +
              `ស្ថានភាព: Confirmed\n` +
              '------------------------------\n' +
              `សរុប: $${order.total_price.toFixed(2)}\n` +
              '------------------------------';

            // Link admin button directly to the admin Telegram account
            const adminUrl = process.env.ADMIN_USERNAME
              ? `https://t.me/${process.env.ADMIN_USERNAME.replace(/^@/, '')}`
              : 'https://t.me/PAPA_Panha';

            // Use a deep link so that clicking "start bot" opens a chat and triggers /start with a payload
            const botDeepLink = botInfo && botInfo.username
              ? `https://t.me/${botInfo.username}?start=order_${order._id}`
              : (process.env.BOT_USERNAME ? `https://t.me/${process.env.BOT_USERNAME.replace(/^@/, '')}?start=order_${order._id}` : botLink);

            const channelKeyboard = Markup.inlineKeyboard([
              [
                Markup.button.url('admin', adminUrl),
                Markup.button.url('start bot', botDeepLink)
              ]
            ]);

            await ctx.telegram.sendMessage(channelId, channelMessage, {
              reply_markup: channelKeyboard.reply_markup
            });
      } catch (err) {
        console.error('Failed to post order to channel', err);
      }
    }
  } catch (error) {
    console.error('Failed to notify admins about confirmed order:', error);
  }
};

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) {
    return;
  }

  const data = callbackQuery.data;
  if (!data.startsWith('confirm_order:')) {
    return;
  }

  const orderId = data.split(':')[1];
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    await safeAnswerCbQuery(ctx, 'ការបញ្ជាក់ការបញ្ជាទិញមិនត្រឹមត្រូវ។');
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'សូមចុះឈ្មោះជាមុនដោយផ្ញើ /start។', { show_alert: true });
    return;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    await safeAnswerCbQuery(ctx, 'មិនឃើញការបញ្ជាទិញ។', { show_alert: true });
    return;
  }

  if (!order.user_id.equals(user._id)) {
    await safeAnswerCbQuery(ctx, 'ការបញ្ជាទិញនេះជาของអ្នកប្រើប្រាស់ផ្សេង។', { show_alert: true });
    return;
  }

  if (order.status !== 'pending') {
    const message = order.status === 'confirmed'
      ? 'ការបញ្ជាទិញនេះបានបញ្ជាក់រួចហើយ។'
      : 'ការបញ្ជាទិញនេះមិននៅក្នុងស្ថានភាពរងចាំទៀតទេ។';
    await safeAnswerCbQuery(ctx, message, { show_alert: true });
    return;
  }

  if (order.expires_at && order.expires_at < new Date()) {
    order.status = 'expired';
    await order.save();
    clearPendingOrderExpiration(orderId);

    if (order.cart_items && order.cart_items.length > 0) {
      for (const item of order.cart_items) {
        if (!item.product_id) continue;
        const expiredProduct = await findProductById(item.product_id);
        if (expiredProduct) {
          expiredProduct.quantity += item.quantity;
          await expiredProduct.save();
        }
      }
    } else {
      const expiredProduct = await findProductById(order.product_id);
      if (expiredProduct) {
        expiredProduct.quantity += order.quantity;
        await expiredProduct.save();
      }
    }

    await safeAnswerCbQuery(ctx, 'ការបញ្ជាទិញបានផុតកំណត់។ សូមបញ្ជាទិញមួយថ្មី។', { show_alert: true });
    return;
  }

  order.status = 'confirmed';
  await order.save();
  clearPendingOrderExpiration(orderId);

  await notifyAdminsAboutConfirmedOrder(ctx, order, user);
  await safeAnswerCbQuery(ctx, 'ការបង់ប្រាក់ត្រូវបានបញ្ជាក់រួចរាល់!');

  const fullName = user.full_name || 'N/A';
  const username = user.username || 'N/A';
  const telegramId = user.telegram_id || 'N/A';
  const orderIdText = order._id.toString();
  const addressText = order.address || 'N/A';

  if (order.cart_items && order.cart_items.length > 0) {
    const cartSummary = order.cart_items.map((item) => `- ${item.product_name} x${item.quantity} = $${item.total_price.toFixed(2)}`).join('\n');
    const channelLink = 'https://t.me/+mVENegLmW-xmYmNl';
    await ctx.reply(
      `✅ Order Confirmed!\n\n` +
      `------------------------------\n` +
      `Telegram ID: ${telegramId}\n` +
      `ឈ្មោះពេញ: ${fullName}\n` +
      `ឈ្មោះអ្នកប្រើប្រាស់: ${username}\n` +
      `អាសយដ្ឋាន: ${addressText}\n` +
      `------------------------------\n` +
      `លេខកូដបញ្ជាទិញ: ${getShortOrderId(order._id)}\n` +
      `សង្ខេបបញ្ជាទិញ:\n${cartSummary}\n` +
      `------------------------------\n` +
      `សរុប: $${order.total_price.toFixed(2)}\n` +
      `ស្ថានភាព: Confirmed\n` +
      `------------------------------`,
      Markup.inlineKeyboard([
        [Markup.button.url('View Channel', channelLink)]
      ])
    );
  } else {
    await ctx.reply(
      `✅ Order Confirmed!\n\n` +
      `------------------------------\n` +
      `Telegram ID: ${telegramId}\n` +
      `ឈ្មោះពេញ: ${fullName}\n` +
      `ឈ្មោះអ្នកប្រើប្រាស់: ${username}\n` +
      `អាសយដ្ឋាន: ${addressText}\n` +
      `------------------------------\n` +
      `លេខកូដបញ្ជាទិញ: ${getShortOrderId(order._id)}\n` +
      `ផលិតផល: ${order.product_name}\n` +
      `ប្រភេទ: ${order.product_category}\n` +
      `បរិមាណ: ${order.quantity}\n` +
      `------------------------------\n` +
      `សរុប: $${order.total_price.toFixed(2)}\n` +
      `ស្ថានភាព: Confirmed\n` +
      `------------------------------`,
      Markup.inlineKeyboard([
        [Markup.button.url('View Channel', 'https://t.me/+mVENegLmW-xmYmNl')]
      ])
    );
  }
};
