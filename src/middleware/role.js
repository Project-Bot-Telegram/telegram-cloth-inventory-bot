const User = require('../models/User');

module.exports = async (ctx, next) => {
  const telegramId = ctx.from.id;

  const user = await User.findOne({
    telegram_id: telegramId
  });

  if (!user) {
    return ctx.reply('Access denied');
  }

  if (user.role !== 'admin') {
    return ctx.reply('Admin only command');
  }

  next();
};