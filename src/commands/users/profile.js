const { Markup } = require('telegraf');
const User = require('../../models/User');

const roleLabel = (role) => {
  if (role === 'admin') return 'គ្រប់គ្រង';
  if (role === 'staff') return 'បុគ្គលិក';
  return role;
};

module.exports = async (ctx) => {
  const telegramId = ctx.from.id;

  const user = await User.findOne({
    telegram_id: telegramId
  });

  if (!user) {
    return ctx.reply('មិនឃើញអ្នកប្រើប្រាស់។');
  }

  const message = '' +
    '------------------------------\n' +
    'ព័ត៌មានប្រវត្តិ\n' +
    '------------------------------\n' +
    `Telegram ID: ${user.telegram_id}\n` +
    `ឈ្មោះពេញ: ${user.full_name}\n` +
    `Username: ${user.username || 'N/A'}\n` +
    `អាសយដ្ឋាន: ${user.address || 'N/A'}\n` +
    `តួនាទី: ${roleLabel(user.role)}\n` +
    `សរសេរពេល: ${user.created_at.toLocaleString()}\n` +
    '------------------------------';

  return ctx.reply(message, Markup.inlineKeyboard([
    [
      Markup.button.callback('ជំនួយ', 'help'),
      Markup.button.callback('គាំទ្រ', 'support'),
      Markup.button.callback('កែប្រែ', 'edit_profile:start')
    ]
  ]));
};