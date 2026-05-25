const { Markup } = require('telegraf');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');
const User = require('../../models/User');

const roleLabel = (role) => {
  if (role === 'admin') return 'admin';
  if (role === 'staff') return 'user';
  return role || 'user';
};

const confirmEditProfile = (ctx) => {
  const data = ctx.session.editProfile.data;

  return ctx.reply(
    'សូមពិនិត្យមើល Information របស់អ្នក:\n\n' +
    `លេខទូរស័ព្ទ: ${data.phone_number || 'N/A'}\n` +
    `ទីតាំង: ${data.address || 'N/A'}\n\n` +
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
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data) {
    return;
  }

  const parts = callbackQuery.data.split(':');
  const type = parts[0];
  const action = parts[1];

  const user = await User.findOne({ telegram_id: ctx.from.id });
  if (!user) {
    await safeAnswerCbQuery(ctx, 'សូមធ្វើការចុះឈ្មោះជាមុនសិនដោយប្រើ​​ command /start.', { show_alert: true });
    return;
  }

  if (type === 'edit_profile' && action === 'start') {
    await safeAnswerCbQuery(ctx);

    return ctx.reply(
      'អ្នកអាចកែប្រែតែលេខទូរស័ព្ទ និង ទីតាំងរបស់អ្នកបានតែប៉ុណ្ណោះ:\n\n' +
      `លេខទូរស័ព្ទ: ${user.phone_number || 'N/A'}\n` +
      `ទីតាំង: ${user.address || 'N/A'}\n\n` +
      '- continue ដើម្បីបន្តកែប្រែ profile របស់អ្នក \n- cancel ដើម្បីបោះបង់ការកែប្រែ!!',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('cancel', 'edit_profile:cancel'),
          Markup.button.callback('continue', 'edit_profile:continue')
        ]
      ])
    );
  }

  if (type === 'edit_profile' && action === 'continue') {
    ctx.session = ctx.session || {};
    ctx.session.editProfile = {
      stepIndex: 0,
      data: {},
      originalData: {
        phone_number: user.phone_number || '',
        address: user.address || ''
      }
    };

    await safeAnswerCbQuery(ctx);
    return ctx.reply('សូមបញ្ចូលលេខទូរស័ព្ទថ្មីរបស់អ្នក:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាទុកលេខចាស់', 'edit_profile:skip_phone')]
    ]));
  }

  if (type === 'edit_profile' && action === 'cancel') {
    await safeAnswerCbQuery(ctx);
    if (ctx.session) {
      ctx.session.editProfile = null;
    }
    return ctx.reply('Profile edit cancelled.');
  }

  if (type === 'edit_profile' && action === 'skip_phone') {
    if (!ctx.session || !ctx.session.editProfile) {
      await safeAnswerCbQuery(ctx, 'No active profile edit.', { show_alert: true });
      return;
    }

    ctx.session.editProfile.data.phone_number = ctx.session.editProfile.originalData.phone_number;
    ctx.session.editProfile.stepIndex = 1;

    await safeAnswerCbQuery(ctx);
    return ctx.reply('សូមបញ្ចូលទីតាំងថ្មីរបស់អ្នក:', Markup.inlineKeyboard([
      [Markup.button.callback('skip ដើម្បីរក្សាទុកទីតាំងចាស់', 'edit_profile:skip_address')]
    ]));
  }

  if (type === 'edit_profile' && action === 'skip_address') {
    if (!ctx.session || !ctx.session.editProfile) {
      await safeAnswerCbQuery(ctx, 'គ្មានការកែប្រែ profile !!', { show_alert: true });
      return;
    }

    ctx.session.editProfile.data.address = ctx.session.editProfile.originalData.address;
    ctx.session.editProfile.stepIndex = 2;

    await safeAnswerCbQuery(ctx);
    return confirmEditProfile(ctx);
  }

  if (type === 'confirm_edit') {
    const confirmed = action === 'yes';
    await safeAnswerCbQuery(ctx);

    if (!ctx.session || !ctx.session.editProfile || !ctx.session.editProfile.data) {
      return ctx.reply('គ្មានការធ្វើបច្ចុប្បន្នភាព profile ដែលកំពុងរងចាំការបញ្ជាក់។');
    }

    if (!confirmed) {
      ctx.session.editProfile = null;
      return ctx.reply('ការ update profile ត្រូវបាន​ concel !!');
    }

    const updatedData = ctx.session.editProfile.data;
    await User.updateOne({ telegram_id: ctx.from.id }, { $set: updatedData });
    ctx.session.editProfile = null;

    return ctx.reply(
      'ការ​ update profile ទទួលបានជោគជ័យ!!\n\n' +
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
      '------------------------------'
    );
  }

  await safeAnswerCbQuery(ctx, 'Invalid profile action.', { show_alert: true });
};
