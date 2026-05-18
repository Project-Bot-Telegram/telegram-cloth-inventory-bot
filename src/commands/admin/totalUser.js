const User = require('../../models/User');

module.exports = async (ctx) => {
  try {
    const count = await User.countDocuments();
    await ctx.reply(`📊 Total users: ${count}`);
  } catch (err) {
    console.error('total-user error', err);
    await ctx.reply('Error fetching total user count.');
  }
};
