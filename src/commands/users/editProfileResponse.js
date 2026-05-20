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
    return ctx.reply('Please use the Cancel button to abort profile editing, or continue entering your information.');
  }

  if (editSession.stepIndex === 0) {
    editSession.data.full_name = text;
    editSession.stepIndex = 1;
    return ctx.reply('Please enter your language code (for example: English, Khmer, etc.).', Markup.inlineKeyboard([
      [Markup.button.callback('Skip for use old language', 'edit_profile:skip_language')]
    ]));
  }

  if (editSession.stepIndex === 1) {
    editSession.data.language = text;
    editSession.stepIndex = 2;
    return ctx.reply('Please enter your delivery address.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip for use old address', 'edit_profile:skip_address')]
    ]));
  }

  if (editSession.stepIndex === 2) {
    editSession.data.address = text;
    editSession.stepIndex = 3;

    const message = `Please confirm your updated profile information:\n\n` +
      `Full name: ${editSession.data.full_name}\n` +
      `Language: ${editSession.data.language}\n` +
      `Address: ${editSession.data.address}`;

    return ctx.reply(message, Markup.inlineKeyboard([
      [Markup.button.callback('Cancel', 'confirm_edit:no'), Markup.button.callback('Confirm', 'confirm_edit:yes')]
    ]));
  }

  return false;
};
