const User = require('../../models/User');

module.exports = async (ctx) => {
  const userId = ctx.match[1];
  if (!userId || isNaN(userId)) {
    return ctx.reply('Usage: /promote-<user_id>\nExample: /promote-1655512983');
  }

  try {
    const user = await User.findOneAndUpdate(
      { telegram_id: parseInt(userId, 10) },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      return ctx.reply(`❌ User not found with ID: ${userId}`);
    }

    await ctx.reply(`✅ ${user.full_name || user.username} is now an admin.`);
  } catch (err) {
    console.error('promote-user error', err);
    await ctx.reply('Error promoting user.');
  }
};
