const { Markup } = require('telegraf');
const User = require('../../models/User');

module.exports = async (ctx) => {
  const telegramId = ctx.from.id;

  const user = await User.findOne({
    telegram_id: telegramId
  });

  if (!user) {
    return ctx.reply('User not found');
  }

  const message = `\nProfile Information\n\nTelegram ID: ${user.telegram_id}\nFull Name: ${user.full_name}\nUsername: ${user.username || 'N/A'}\nLanguage: ${user.language}\nAddress: ${user.address || 'N/A'}\nRole: ${user.role}\nCreated At: ${user.created_at.toLocaleString()}`;

  return ctx.reply(message, Markup.inlineKeyboard([
    [
      Markup.button.callback('Help', 'help'),
      Markup.button.callback('Support', 'support'),
      Markup.button.callback('Edit', 'edit_profile:start')
    ]
  ]));
};