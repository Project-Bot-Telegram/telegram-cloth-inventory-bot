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

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'សូមចុះឈ្មោះជាមុនដោយផ្ញើ /start។', { show_alert: true });
    return;
  }

  if (action === 'start') {
    await safeAnswerCbQuery(ctx);

    return ctx.reply(
      `អ្នកអាចកែប្រែបានតែឈ្មោះពេញ និងអាសយដ្ឋានរបស់អ្នកតែប៉ុណ្ណោះ\n\n` +
      `current profile:\n` +
      `• ឈ្មោះពេញ: ${user.full_name || 'N/A'}\n` +
      `• អាសយដ្ឋាន: ${user.address || 'N/A'}\n\n` +
      `តើអ្នកចង់បន្តកែប្រែមែនទេ?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('cancel', 'edit_profile:cancel'), Markup.button.callback('continue', 'edit_profile:continue')]
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
        address: user.address || ''
      }
    };

    await safeAnswerCbQuery(ctx);
    return ctx.reply('សូមបញ្ចូលឈ្មោះពេញថ្មីរបស់អ្នក:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីប្រើឈ្មោះចាស់', 'edit_profile:skip_fullname')]
    ]));
  }

  if (type === 'edit_profile' && action === 'cancel') {
    await safeAnswerCbQuery(ctx);
    if (ctx.session) {
      ctx.session.editProfile = null;
    }
    return ctx.reply('ការកែប្រែប្រវត្តិបុគ្គលបានបោះបង់។');
  }

  if (type === 'edit_profile' && action === 'skip_fullname') {
    if (!ctx.session || !ctx.session.editProfile) {
      await safeAnswerCbQuery(ctx, 'មិនមានកម្មវិធីកែប្រែសកម្មទេ។', { show_alert: true });
      return;
    }

    ctx.session.editProfile.data.full_name = ctx.session.editProfile.originalData.full_name;
    ctx.session.editProfile.stepIndex = 1;

    await safeAnswerCbQuery(ctx);
    return ctx.reply('សូមផ្ញើអាសយដ្ឋានថ្មីរបស់អ្នក:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីប្រើអាសយដ្ឋានចាស់', 'edit_profile:skip_address')]
    ]));
  }

  if (type === 'edit_profile' && action === 'skip_address') {
    if (!ctx.session || !ctx.session.editProfile) {
      await safeAnswerCbQuery(ctx, 'មិនមានកម្មវិធីកែប្រែសកម្មទេ។', { show_alert: true });
      return;
    }

    ctx.session.editProfile.data.address = ctx.session.editProfile.originalData.address;
    ctx.session.editProfile.stepIndex = 2;

    await safeAnswerCbQuery(ctx);
    const message = `សូមផ្ទៀងផ្ទាត់ព័ត៌មានប្រវត្តិរូបថ្មីរបស់អ្នក:\n\n` +
      `ឈ្មោះពេញ: ${ctx.session.editProfile.data.full_name}\n` +
      `អាសយដ្ឋាន: ${ctx.session.editProfile.data.address}\n\n`; +
      `សូមចុច "update" ដើម្បីរក្សាទុក ឬ "cancel" ដើម្បីបោះបង់។`;

    return ctx.reply(message, Markup.inlineKeyboard([
      [Markup.button.callback('cancel', 'confirm_edit:no'), Markup.button.callback('update', 'confirm_edit:yes')]
    ]));
  }

  if (type === 'confirm_edit') {
    const confirmed = action === 'yes';
    await safeAnswerCbQuery(ctx);

    if (!ctx.session || !ctx.session.editProfile || !ctx.session.editProfile.data) {
      return ctx.reply('មិនមានការផ្លាស់ប្តូរប្រវត្តិដែលកំពុងរងចាំ។');
    }

    if (!confirmed) {
      ctx.session.editProfile = null;
      return ctx.reply('ការអាប់ដេតប្រវត្តិរូបរបស់អ្នកបានបរ៉ាជ័យ!!');
    }

    const updatedData = ctx.session.editProfile.data;
    await User.updateOne({ telegram_id: ctx.from.id }, { $set: updatedData });
    ctx.session.editProfile = null;

    return ctx.reply(
      `ប្រវត្តិរូបថ្មីរបស់អ្នកបានធ្វើការ update បានដោយជោគជ័យ!!\n\n` +
      `ឈ្មោះពេញ: ${updatedData.full_name}\n` +
      `អាសយដ្ឋាន: ${updatedData.address}`
    );
  }

  await safeAnswerCbQuery(ctx, 'សកម្មភាពប្រវត្តិបុគ្គលមិនត្រឹមត្រូវ។', { show_alert: true });
};
