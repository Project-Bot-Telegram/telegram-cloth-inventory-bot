const { Markup } = require('telegraf');

const confirmEditProfile = (ctx, editSession) => {
  return ctx.reply(
    'សូមពិនិត្យមើល Information របស់អ្នក:\n\n' +
    `លេខទូរស័ព្ទ: ${editSession.data.phone_number || 'N/A'}\n` +
    `ទីតាំង: ${editSession.data.address || 'N/A'}\n\n` +
    '- update ដើម្បីរក្សាទុកព័ត៌មាននេះ \n- cancel ដើម្បីបញ្ចូលឡើងវិញ!!',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('cancel', 'confirm_edit:no'),
        Markup.button.callback('update', 'confirm_edit:yes')
      ]
    ])
  );
};

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
    return ctx.reply('សូមប្រើប្រាស់ប៊ូតុងកែប្រែ profile ឬបញ្ចូលព័ត៌មានដែលត្រូវការ!!');
  }

  if (editSession.stepIndex === 0) {
    editSession.data.phone_number = text;
    editSession.stepIndex = 1;
    return ctx.reply('សូមបញ្ចូលទីតាំងថ្មីរបស់អ្នក:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាទុកទីតាំងចាស់', 'edit_profile:skip_address')]
    ]));
  }

  if (editSession.stepIndex === 1) {
    editSession.data.address = text;
    editSession.stepIndex = 2;
    return confirmEditProfile(ctx, editSession);
  }

  return false;
};
