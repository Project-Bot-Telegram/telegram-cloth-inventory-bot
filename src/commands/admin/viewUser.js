const User = require('../../models/User');

module.exports = async (ctx) => {
  const userId = ctx.match[1];
  if (!userId || isNaN(userId)) {
    return ctx.reply('Usage: /view-<user_id>\nExample: /view-1655512983');
  }

  try {
    const user = await User.findOne({ telegram_id: parseInt(userId, 10) });
    if (!user) {
      return ctx.reply(`User not found with ID: ${userId}`);
    }

    await ctx.reply(
      `User Information\n\n` +
      `Telegram ID: ${user.telegram_id}\n` +
      `Full Name: ${user.full_name}\n` +
      `Username: ${user.username || 'N/A'}\n` +
      `Phone: ${user.phone_number || 'N/A'}\n` +
      `Address: ${user.address || 'N/A'}\n` +
      `Role: ${user.role}\n` +
      `Created: ${user.created_at.toLocaleString()}`
    );
  } catch (err) {
    console.error('view-user error', err);
    await ctx.reply('Error fetching user information.');
  }
};
