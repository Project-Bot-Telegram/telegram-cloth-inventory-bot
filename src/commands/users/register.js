const User = require('../../models/User');
const { mainMenuKeyboard } = require('../../utils/keyboards');
const supportCommand = require('../support/support');

const registrationQuestions = [
  { key: 'full_name', prompt: 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក:' },
  { key: 'address', prompt: 'សូមបញ្ចូលអាសយដ្ឋានដឹកជញ្ជូនរបស់អ្នក:' }
];

const startRegistration = async (ctx) => {
  ctx.session = ctx.session || {};
  const telegramUser = ctx.from;
  const username = telegramUser.username || `${telegramUser.first_name || ''}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`.trim();

  ctx.session.registration = {
    stepIndex: 0,
    data: {
      telegram_id: telegramUser.id,
      username: username || null
    }
  };

  await ctx.reply('សូមស្វាគមន៍មកកាន់ bot telegram លកផលិតផលរបស់យើងខ្ញុំ!!', mainMenuKeyboard(false));
  await ctx.reply('ដើម្បីចាប់ផ្តើម សូមបញ្ចូលព័ត៌មានខ្លះៗរបស់អ្នក!!');
  await ctx.reply(registrationQuestions[0].prompt);
};

const handleRegistrationResponse = async (ctx, text) => {
  const registration = ctx.session.registration;
  const currentQuestion = registrationQuestions[registration.stepIndex];

  registration.data[currentQuestion.key] = text.trim();
  registration.stepIndex += 1;

  if (registration.stepIndex < registrationQuestions.length) {
    const nextQuestion = registrationQuestions[registration.stepIndex];
    await ctx.reply(nextQuestion.prompt);
    return;
  }

  const user = new User(registration.data);
  await user.save();

  ctx.session.registration = null;

  const doneMsg = '' +

    'ការចុះឈ្មោះបានជោគជ័យ\n' +
    `សូមអរគុណ"${user.full_name}!" សម្រាប់ការចុះឈ្មោះរបស់អ្នក​ បានបញ្ចប់ដោយជោគជ័យ!!\n`;
  await ctx.reply(doneMsg, mainMenuKeyboard(user.role === 'admin'));
  // Show support/help message to newly registered non-admin users
  if (!user.role || user.role !== 'admin') {
    await supportCommand(ctx);
  }
};

module.exports = async (ctx) => {
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

    // Detect if /start was called with a payload (deep link). Telegram sends: "/start <payload>"
    const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';
    const parts = text.split(/\s+/);
    const startPayload = parts.length > 1 ? parts.slice(1).join(' ') : null;

    // Only treat deep-links that match our order payload pattern as requests to show support
    const isOrderPayload = startPayload && /^order_/.test(startPayload);

    if (isOrderPayload) {
      await ctx.reply(`សូមស្វាគមន៍នៃការត្រឡប់មកប្រើប្រាស់ម្ដងទៀត , ${displayName}!`, mainMenuKeyboard(existingUser.role === 'admin'));
      return supportCommand(ctx);
    }

    // Regular /start: show welcome. For non-admin users (staff/customers) also show support help.
    await ctx.reply(`សូមស្វាគមន៍នៃការត្រឡប់មកប្រើប្រាស់ម្ដងទៀត , ${displayName}!`, mainMenuKeyboard(existingUser.role === 'admin'));
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