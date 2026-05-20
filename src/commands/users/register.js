const User = require('../../models/User');
const { mainMenuKeyboard } = require('../../utils/keyboards');

const registrationQuestions = [
  { key: 'full_name', prompt: 'Please enter your full name:' },
  { key: 'language', prompt: 'What language do you speak? (English, Khmer, etc.)' },
  { key: 'address', prompt: 'Please enter your delivery address:' }
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

  await ctx.reply('Welcome to bot!', mainMenuKeyboard());
  await ctx.reply('Let’s register your profile.');
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

  await ctx.reply(`Thanks ${user.full_name}! Your registration is complete.`, mainMenuKeyboard());
};

module.exports = async (ctx) => {
  if (!ctx.from || !ctx.from.id) {
    return ctx.reply('Unable to identify your account.');
  }

  const telegramUser = ctx.from;
  const existingUser = await User.findOne({ telegram_id: telegramUser.id });

  if (existingUser) {
    if (ctx.session) {
      ctx.session.registration = null;
    }

    const displayName = existingUser.full_name || existingUser.username || 'there';
    return ctx.reply(`Welcome back, ${displayName}!`, mainMenuKeyboard());
  }

  if (ctx.session && ctx.session.registration) {
    const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : '';

    if (!text || text.startsWith('/')) {
      return ctx.reply('Please answer the current registration question instead of sending a command.');
    }

    return handleRegistrationResponse(ctx, text);
  }

  return startRegistration(ctx);
};