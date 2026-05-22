const { Markup } = require('telegraf');

module.exports = async (ctx) => {
  if (!ctx.session || !ctx.session.editProfile) {
    return false;
  }

  if (!ctx.message || !ctx.message.text) {
    return false;
  }

  const text = ctx.message.text.trim();
  const editSession = ctx.session.editProfile;

  if (text.startsWith('/')) {
    return ctx.reply('សូមប្រើប៊ូតុង​ cancel ដើម្បីបោះបង់ការកែប្រែប្រវត្តិបុគ្គល ឬ continue ដើម្បីបន្តបញ្ចូលព័ត៌មានរបស់អ្នក។');
  }

  if (editSession.stepIndex === 0) {
    editSession.data.full_name = text;
    editSession.stepIndex = 1;
    return ctx.reply('សូមបញ្ចូលអាសយដ្ឋានដឹកជញ្ជូនថ្មីរបស់អ្នក!!', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីប្រើអាសយដ្ឋានចាស់', 'edit_profile:skip_address')]
    ]));
  }

  if (editSession.stepIndex === 1) {
    editSession.data.address = text;
    editSession.stepIndex = 2;

    const message = `សូមផ្ទៀងផ្ទាត់ព័ត៌មានប្រវត្តិរូបថ្មីរបស់អ្នក:\n\n` +
      `ឈ្មោះពេញ: ${editSession.data.full_name}\n` +
      `អាសយដ្ឋាន: ${editSession.data.address}\n\n` +
      `សូមចុច "update" ដើម្បីរក្សាទុក ឬ "cancel" ដើម្បីបោះបង់។`;

    return ctx.reply(message, Markup.inlineKeyboard([
      [Markup.button.callback('cancel', 'confirm_edit:no'), Markup.button.callback('update', 'confirm_edit:yes')]
    ]));
  }

  return false;
};
