const User = require('../../models/User');

module.exports = async (ctx) => {
  const userId = ctx.match[1];
  if (!userId || isNaN(userId)) {
    return ctx.reply('Usage: /view-<user_id>\nExample: /view-1655512983');
  }

  try {
    const user = await User.findOne({ telegram_id: parseInt(userId, 10) });
    if (!user) {
      return ctx.reply(`❌ User not found with ID: ${userId}`);
    }

    await ctx.reply(`👤 User Information\n\nTelegram ID: ${user.telegram_id}\nFull Name: ${user.full_name}\nUsername: ${user.username || 'N/A'}\nLanguage: ${user.language}\nRole: ${user.role}\nCreated: ${user.created_at.toLocaleString()}`);
  } catch (err) {
    console.error('view-user error', err);
    await ctx.reply('Error fetching user information.');
  }
};
