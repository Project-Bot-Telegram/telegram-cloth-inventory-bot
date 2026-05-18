const User = require('../../models/User');

module.exports = async (ctx) => {
  const telegramId = ctx.from.id;

  const user = await User.findOne({
    telegram_id: telegramId
  });

  if (!user) {
    return ctx.reply('User not found');
  }

  ctx.reply(`
Profile Information

Full Name: ${user.full_name}
Username: ${user.username}
Language: ${user.language}
Role: ${user.role}
  `);
};