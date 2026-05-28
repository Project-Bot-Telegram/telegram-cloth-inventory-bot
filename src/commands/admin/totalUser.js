const { Markup } = require('telegraf');
const User = require('../../models/User');
const { safeAnswerCbQuery } = require('../../utils/telegramHelper');

const PAGE_SIZE = 10;

const buildUserMessage = (users, startIndex, total) => {
  const lines = users.map((user, index) => {
    const displayIndex = startIndex + index + 1;
    const username = user.username ? `@${user.username}` : 'No username';
    const fullName = user.full_name || 'No name';
    const phone = user.phone_number || 'N/A';
    const address = user.address || 'N/A';
    const role = user.role || 'staff';
    const createdAt = user.created_at ? user.created_at.toLocaleDateString() : 'N/A';

    return `#${displayIndex} ${fullName} (${username})\nID: ${user.telegram_id}\nPhone: ${phone}\nAddress: ${address}\nRole: ${role}\nCreated: ${createdAt}`;
  });

  return `📋 Users ${startIndex + 1}-${startIndex + users.length} of ${total}\n\n${lines.join('\n\n')}`;
};

const sendUserPage = async (ctx, startIndex, isCallback = false) => {
  const total = await User.countDocuments();
  const users = await User.find()
    .sort({ created_at: -1 })
    .skip(startIndex)
    .limit(PAGE_SIZE + 1);

  const page = users.slice(0, PAGE_SIZE);
  if (page.length === 0) {
    if (isCallback) {
      await safeAnswerCbQuery(ctx, 'No more users to show.');
      return;
    }
    await ctx.reply('No users found.');
    return;
  }

  if (isCallback) {
    await safeAnswerCbQuery(ctx);
  }

  const hasMore = users.length > PAGE_SIZE;
  const keyboard = hasMore
    ? Markup.inlineKeyboard([
      [Markup.button.callback('Show 10 more', `totaluser_more:${startIndex + PAGE_SIZE}`)]
    ])
    : null;

  const message = buildUserMessage(page, startIndex, total);
  await ctx.reply(message, keyboard);
};

const totalUserCommand = async (ctx) => {
  try {
    await sendUserPage(ctx, 0);
  } catch (err) {
    console.error('totaluser error', err);
    await ctx.reply('Error fetching users.');
  }
};

totalUserCommand.handleMore = async (ctx) => {
  const callbackData = ctx.callbackQuery && ctx.callbackQuery.data;
  if (!callbackData) {
    return;
  }

  const [, offsetString] = callbackData.split(':');
  const offset = parseInt(offsetString, 10);
  if (Number.isNaN(offset) || offset < 0) {
    await safeAnswerCbQuery(ctx, 'Invalid page offset.');
    return;
  }

  try {
    await sendUserPage(ctx, offset, true);
  } catch (err) {
    console.error('totaluser error', err);
    await safeAnswerCbQuery(ctx, 'Error fetching more users.');
  }
};

module.exports = totalUserCommand;
