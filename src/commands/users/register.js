const User = require('../../models/User');
const { mainMenuKeyboard } = require('../../utils/keyboards');

const registrationQuestions = [
  { key: 'full_name', prompt: 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក៖' },
  { key: 'address', prompt: 'សូមបញ្ចូលអាសយដ្ឋានដឹកជញ្ជូនរបស់អ្នក៖' }
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

  await ctx.reply('សូមស្វាគមន៍មកកាន់បូត!', mainMenuKeyboard(false));
  await ctx.reply('------------------------------\nការចុះឈ្មោះ\n------------------------------');
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
    '------------------------------\n' +
    'ការចុះឈ្មោះបានសម្រេច\n' +
    '------------------------------\n' +
    `សូមអរគុណ ${user.full_name}! ការចុះឈ្មោះរបស់អ្នកបានបញ្ចប់។\n` +
    '------------------------------';
  await ctx.reply(doneMsg, mainMenuKeyboard(user.role === 'admin'));
};

module.exports = async (ctx) => {
  if (!ctx.from || !ctx.from.id) {
    return ctx.reply('មិនអាចកំណត់គណនីរបស់អ្នកបាន។');
  }

  const telegramUser = ctx.from;
  const existingUser = await User.findOne({ telegram_id: telegramUser.id });

  if (existingUser) {
    if (ctx.session) {
      ctx.session.registration = null;
    }

    const displayName = existingUser.full_name || existingUser.username || 'there';
    return ctx.reply(`សូមស្វាគមន៍វិញ, ${displayName}!`, mainMenuKeyboard(existingUser.role === 'admin'));
  }

  if (ctx.session && ctx.session.registration) {
    const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';

    if (!text || text.startsWith('/')) {
      return ctx.reply('សូមឆ្លើយសំណួរក្នុងការចុះឈ្មោះ បើកមុន មិនត្រូវផ្ញើពាក្យបញ្ជា។');
    }

    return handleRegistrationResponse(ctx, text);
  }

  return startRegistration(ctx);
};