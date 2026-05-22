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
    await safeAnswerCbQuery(ctx, 'សូមចុះឈ្មោះជាមុនដោយផ្ញើ /start។', { show_alert: true });
    return;
  }

  const pendingOrder = ctx.session && ctx.session.pendingOrder;
  if (!pendingOrder) {
    await safeAnswerCbQuery(ctx, 'មិនមានការបញ្ជាទិញនៅខាងមុខទេ។ សូមបញ្ជាទិញជាមុន។', { show_alert: true });
    return;
  }

  if (choice === 'profile') {
    if (!user.address) {
      await safeAnswerCbQuery(ctx);
      return ctx.reply('ក្នុងប្រវត្តិរបស់អ្នកមិនមានអាសយដ្ឋានដឹកជញ្ជូនដែលបានរក្សាទុកទេ។ សូមផ្ញើអាសយដ្ឋានដឹកជញ្ជូនរបស់អ្នកឥឡូវ។');
    }

    await safeAnswerCbQuery(ctx);
    return handlePendingOrderAddress.finalizePendingOrder(ctx, user, user.address);
  }

  if (choice === 'new') {
    await safeAnswerCbQuery(ctx);
    return ctx.reply('សូមផ្ញើអាសយដ្ឋានដឹកជញ្ជូនរបស់អ្នកដើម្បីបន្ត។');
  }

  await safeAnswerCbQuery(ctx, 'ជម្រើសអាសយដ្ឋានមិនត្រឹមត្រូវ។', { show_alert: true });
};
