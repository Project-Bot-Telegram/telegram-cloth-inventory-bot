const { Markup } = require('telegraf');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');
const User = require('../../models/User');

module.exports = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) {
    return;
  }

  const parts = callbackQuery.data.split(':');
  const type = parts[0];
  const action = parts[1];
  const value = parts[2] || '';

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'Please register first by sending /start.', { show_alert: true });
    return;
  }

  if (action === 'start') {
    await safeAnswerCbQuery(ctx);

    return ctx.reply(
      `You can change your full name, language code, and address.\n\n` +
      `Current values:\n` +
      `• Full name: ${user.full_name || 'N/A'}\n` +
      `• Language: ${user.language || 'N/A'}\n` +
      `• Address: ${user.address || 'N/A'}\n\n` +
      `Are you sure you want edit?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('Cancel', 'edit_profile:cancel'), Markup.button.callback('Continue edit', 'edit_profile:continue')]
      ])
    );
  }

  if (action === 'continue') {
    ctx.session = ctx.session || {};
    ctx.session.editProfile = {
      stepIndex: 0,
      data: {},
      originalData: {
        full_name: user.full_name || '',
        language: user.language || '',
        address: user.address || ''
      }
    };

    await safeAnswerCbQuery(ctx);
    return ctx.reply('Send your new full name to begin editing.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip for use old full name', 'edit_profile:skip_fullname')]
    ]));
  }

  if (type === 'edit_profile' && action === 'cancel') {
    await safeAnswerCbQuery(ctx);
    if (ctx.session) {
      ctx.session.editProfile = null;
    }
    return ctx.reply('Profile edit canceled.');
  }

  if (type === 'edit_profile' && action === 'skip_fullname') {
    if (!ctx.session || !ctx.session.editProfile) {
      await safeAnswerCbQuery(ctx, 'No active edit session found.', { show_alert: true });
      return;
    }

    ctx.session.editProfile.data.full_name = ctx.session.editProfile.originalData.full_name;
    ctx.session.editProfile.stepIndex = 1;

    await safeAnswerCbQuery(ctx);
    return ctx.reply('Send your new language code.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip for use old language', 'edit_profile:skip_language')]
    ]));
  }

  if (type === 'edit_profile' && action === 'skip_language') {
    if (!ctx.session || !ctx.session.editProfile) {
      await safeAnswerCbQuery(ctx, 'No active edit session found.', { show_alert: true });
      return;
    }

    ctx.session.editProfile.data.language = ctx.session.editProfile.originalData.language;
    ctx.session.editProfile.stepIndex = 2;

    await safeAnswerCbQuery(ctx);
    return ctx.reply('Send your new address.', Markup.inlineKeyboard([
      [Markup.button.callback('Skip for use old address', 'edit_profile:skip_address')]
    ]));
  }

  if (type === 'edit_profile' && action === 'skip_address') {
    if (!ctx.session || !ctx.session.editProfile) {
      await safeAnswerCbQuery(ctx, 'No active edit session found.', { show_alert: true });
      return;
    }

    ctx.session.editProfile.data.address = ctx.session.editProfile.originalData.address;
    ctx.session.editProfile.stepIndex = 3;

    await safeAnswerCbQuery(ctx);
    const message = `Please confirm your updated profile information:\n\n` +
      `Full name: ${ctx.session.editProfile.data.full_name}\n` +
      `Language: ${ctx.session.editProfile.data.language}\n` +
      `Address: ${ctx.session.editProfile.data.address}`;

    return ctx.reply(message, Markup.inlineKeyboard([
      [Markup.button.callback('Cancel', 'confirm_edit:no'), Markup.button.callback('Confirm', 'confirm_edit:yes')]
    ]));
  }

  if (type === 'confirm_edit') {
    const confirmed = action === 'yes';
    await safeAnswerCbQuery(ctx);

    if (!ctx.session || !ctx.session.editProfile || !ctx.session.editProfile.data) {
      return ctx.reply('No pending profile changes were found.');
    }

    if (!confirmed) {
      ctx.session.editProfile = null;
      return ctx.reply('Profile update canceled.');
    }

    const updatedData = ctx.session.editProfile.data;
    await User.updateOne({ telegram_id: ctx.from.id }, { $set: updatedData });
    ctx.session.editProfile = null;

    return ctx.reply(
      `Profile updated successfully.\n\n` +
      `Full name: ${updatedData.full_name}\n` +
      `Language: ${updatedData.language}\n` +
      `Address: ${updatedData.address}`
    );
  }

  await safeAnswerCbQuery(ctx, 'Invalid profile action.', { show_alert: true });
};
