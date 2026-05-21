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

  const message = '' +
    '------------------------------\n' +
    'Profile Information\n' +
    '------------------------------\n' +
    `Telegram ID: ${user.telegram_id}\n` +
    `Full Name: ${user.full_name}\n` +
    `Username: ${user.username || 'N/A'}\n` +
    `Language: ${user.language}\n` +
    `Address: ${user.address || 'N/A'}\n` +
    `Role: ${user.role}\n` +
    `Created At: ${user.created_at.toLocaleString()}\n` +
    '------------------------------';

  return ctx.reply(message, Markup.inlineKeyboard([
    [
      Markup.button.callback('Help', 'help'),
      Markup.button.callback('Support', 'support'),
      Markup.button.callback('Edit', 'edit_profile:start')
    ]
  ]));
};