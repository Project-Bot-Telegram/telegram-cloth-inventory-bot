const User = require('../models/User');

module.exports = async (ctx, next) => {
  if (!ctx.from || !ctx.from.id) {
    return ctx.reply('Unable to identify your account.');
  }

  const user = await User.findOne({ telegram_id: ctx.from.id });

  if (!user) {
    return ctx.reply('Please register first by sending /start.');
  }

  return next();
};
