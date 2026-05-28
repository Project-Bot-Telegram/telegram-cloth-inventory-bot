const { Markup } = require('telegraf');
const User = require('../../models/User');
const { mainMenuKeyboard } = require('../../utils/keyboards');
const supportCommand = require('../support/support');

const registrationQuestions = [
  { key: 'phone_number', prompt: 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក:' },
  { key: 'address', prompt: 'សូមបញ្ចូលទីតាំងរបស់អ្នក:' }
];

const getTelegramFullName = (telegramUser) => {
  const fullName = `${telegramUser.first_name || ''}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`.trim();
  return fullName || telegramUser.username || `Telegram User ${telegramUser.id}`;
};

const roleLabel = (role) => {
  if (role === 'admin') return 'admin';
  if (role === 'staff') return 'user';
  return role || 'user';
};

const buildProfileMessage = (user) => {
  return '' +
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
};

const startRegistration = async (ctx) => {
  ctx.session = ctx.session || {};
  const telegramUser = ctx.from;
  const fullName = getTelegramFullName(telegramUser);

  ctx.session.registration = {
    awaitingChoice: true,
    stepIndex: 0,
    data: {
      telegram_id: telegramUser.id,
      username: telegramUser.username || null,
      full_name: fullName,
      phone_number: null,
      address: null
    }
  };

  const user = new User(ctx.session.registration.data);
  await user.save();

  await ctx.reply(`សូមស្វាគមន៍មកកាន់ bot telegram លក់ផលិតផលរបស់យើងខ្ញុំ, ${fullName}!!`, mainMenuKeyboard(false));
  await ctx.reply(
    'ដើម្បីសម្រួលដល់ការដឹកជញ្ជូន និង ការទំនាក់ទំនងសេវាកម្មអតិថិជន\n'+
    'យើងត្រូវការព័ត៌មានរបស់អ្នកមួយចំនួនដូចជា:\n\n' +
    '- លេខទូរស័ព្ទ\n' +
    '- ទីតាំង\n\n' +
    '-skip ដើម្បីរំលង\n- continue ដើម្បីបញ្ចូលព័ត៌មានរបស់អ្នក',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('skip', 'registration_choice:skip'),
        Markup.button.callback('continue', 'registration_choice:continue')
      ]
    ])
  );
};

const showRegistrationConfirmation = async (ctx) => {
  const registration = ctx.session.registration;
  const data = registration.data;
  registration.awaitingConfirmation = true;

  return ctx.reply(
    'សូមពិនិត្យមើល Information របស់អ្នក:\n\n' +
    `លេខទូរស័ព្ទ: ${registration.data.phone_number || 'N/A'}\n` +
    `ទីតាំង: ${registration.data.address || 'N/A'}\n\n` +
    '- improve ដើម្បីកែប្រែ \n- cancel ដើម្បីបញ្ចូលឡើងវិញ!!',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('cancel', 'registration_confirm:cancel'),
        Markup.button.callback('improve', 'registration_confirm:improve')
      ]
    ])
  );
};

const saveRegisteredUser = async (ctx) => {
  const data = ctx.session.registration.data;

  await User.updateOne(
    { telegram_id: data.telegram_id },
    {
      $set: {
        phone_number: data.phone_number || null,
        address: data.address || null
      }
    }
  );

  const user = await User.findOne({ telegram_id: data.telegram_id });
  ctx.session.registration = null;

  const doneMsg = '' +
    'ការចុះឈ្មោះបានជោគជ័យ\n' +
    `សូមអរគុណ "${user.full_name}!" \nសម្រាប់ការចុះឈ្មោះរបស់អ្នក បានបញ្ចប់ដោយជោគជ័យ!!\n`;
  await ctx.reply(doneMsg, mainMenuKeyboard(user.role === 'admin'));
  await ctx.reply(buildProfileMessage(user));

  if (!user.role || user.role !== 'admin') {
    await supportCommand(ctx);
  }
};

const handleRegistrationResponse = async (ctx, text) => {
  const registration = ctx.session.registration;

  if (registration.awaitingChoice) {
    return ctx.reply('សូមចុចប៊ូតុង skip ឬ continue ខាងក្រោម ដើម្បីបន្ត។');
  }

  if (registration.awaitingConfirmation) {
    return ctx.reply('សូមប្រើប្រាស់ប៊ូតុង cancel ឬ improve ខាងក្រោមនៃព័ត៌មានរបស់អ្នក:');
  }

  const currentQuestion = registrationQuestions[registration.stepIndex];
  registration.data[currentQuestion.key] = text.trim();
  registration.stepIndex += 1;

  if (registration.stepIndex < registrationQuestions.length) {
    const nextQuestion = registrationQuestions[registration.stepIndex];
    await ctx.reply(nextQuestion.prompt);
    return;
  }

  return showRegistrationConfirmation(ctx);
};

const handleRegistrationCallback = async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery || !callbackQuery.data || (!callbackQuery.data.startsWith('registration_confirm:') && !callbackQuery.data.startsWith('registration_choice:'))) {
    return false;
  }

  const action = callbackQuery.data.split(':')[1];

  if (!ctx.session || !ctx.session.registration) {
    await ctx.answerCbQuery();
    await ctx.reply('គ្មានការចុះឈ្មោះដែលកំពុងរងចាំការបញ្ជាក់។ សូមផ្ញើ /start ដើម្បីចុះឈ្មោះ។');
    return true;
  }

  if (action === 'cancel') {
    ctx.session.registration.stepIndex = 0;
    ctx.session.registration.awaitingConfirmation = false;
    delete ctx.session.registration.data.phone_number;
    delete ctx.session.registration.data.address;

    await ctx.answerCbQuery();
    await ctx.reply('សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នកឡើងវិញ:');
    return true;
  }

  if (action === 'improve') {
    if (!ctx.session.registration.data.phone_number || !ctx.session.registration.data.address) {
      ctx.session.registration.stepIndex = 0;
      ctx.session.registration.awaitingConfirmation = false;
      await ctx.answerCbQuery('សូមបញ្ចូលលេខទូរស័ព្ទ និង ទីតាំងរបស់អ្នកជាមុនសិន។', { show_alert: true });
      return true;
    }

    await ctx.answerCbQuery();
    await saveRegisteredUser(ctx);
    return true;
  }

  if (action === 'skip') {
    ctx.session.registration = null;
    await ctx.answerCbQuery();
    await ctx.reply('អ្នកបានរំលងការបញ្ចូលព័ត៌មានរបស់អ្នក!! អ្នកអាចបញ្ចូលព័ត៌មានរបស់អ្នកនៅពេលណាមួយដោយប្រើ /profile ដើម្បីកែប្រែព័ត៌មានរបស់អ្នក។', mainMenuKeyboard(false));
    await supportCommand(ctx);
    return true;
  }

  if (action === 'continue') {
    ctx.session.registration.awaitingChoice = false;
    ctx.session.registration.stepIndex = 0;
    await ctx.answerCbQuery();
    await ctx.reply(registrationQuestions[0].prompt);
    return true;
  }

  await ctx.answerCbQuery('Invalid registration action.', { show_alert: true });
  return true;
};

const registerCommand = async (ctx) => {
  if (!ctx.from || !ctx.from.id) {
    return ctx.reply('មិនអាចកំណត់គណនីរបស់អ្នកបាន!!');
  }

  const telegramUser = ctx.from;
  const existingUser = await User.findOne({ telegram_id: telegramUser.id });

  if (existingUser) {
    if (ctx.session) {
      ctx.session.registration = null;
    }

    const displayName = existingUser.full_name || existingUser.username || 'there';

    const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';
    const parts = text.split(/\s+/);
    const startPayload = parts.length > 1 ? parts.slice(1).join(' ') : null;
    const isOrderPayload = startPayload && /^order_/.test(startPayload);

    if (isOrderPayload) {
      await ctx.reply(`សូមស្វាគមន៍នៃការត្រឡប់មកប្រើប្រាស់ម្ដងទៀត!! ${displayName}!`, mainMenuKeyboard(existingUser.role === 'admin'));
      return supportCommand(ctx);
    }

    await ctx.reply(`សូមស្វាគមន៍នៃការត្រឡប់មកប្រើប្រាស់ម្ដងទៀត!! ${displayName}!`, mainMenuKeyboard(existingUser.role === 'admin'));
    if (!existingUser.role || existingUser.role !== 'admin') {
      return supportCommand(ctx);
    }
    return;
  }

  if (ctx.session && ctx.session.registration) {
    const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';

    if (!text || text.startsWith('/')) {
      return ctx.reply('សូមធ្វើការចុះឈ្មោះជាមុនសិន មុននឹងធ្វើការប្រើប្រាស់ពាក្យបញ្ជា!!');
    }

    return handleRegistrationResponse(ctx, text);
  }

  return startRegistration(ctx);
};

registerCommand.handleCallback = handleRegistrationCallback;

module.exports = registerCommand;
