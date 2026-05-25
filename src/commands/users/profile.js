const { Markup } = require('telegraf');
const User = require('../../models/User');

const roleLabel = (role) => {
  if (role === 'admin') return 'admin';
  if (role === 'staff') return 'user';
  return role;
};

module.exports = async (ctx) => {
  const telegramId = ctx.from.id;

  const user = await User.findOne({
    telegram_id: telegramId
  });

  if (!user) {
    return ctx.reply('រកមិនឃើញអ្នកប្រើប្រាស់!! សូមចុះឈ្មោះជាមុនសិន។');
  }

  const message = '' +
    '------------------------------\n' +
    'Profile Information\n' +
    '------------------------------\n' +
    `Telegram ID : ${user.telegram_id}\n` +
    `ឈ្មោះ : ${user.full_name}\n` +
    `Username : ${user.username || 'N/A'}\n` +
    `Phone : ${user.phone_number || 'N/A'}\n` +
    `ទីតាំង : ${user.address || 'N/A'}\n` +
    `role : ${roleLabel(user.role)}\n` +
    `date : ${user.created_at.toLocaleString()}\n` +
    '------------------------------';

  return ctx.reply(message, Markup.inlineKeyboard([
    [
      Markup.button.callback('help', 'help'),
      Markup.button.callback('support', 'support'),
      Markup.button.callback('edit', 'edit_profile:start')
    ]
  ]));
};  
