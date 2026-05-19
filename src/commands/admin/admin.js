module.exports = async (ctx) => {
  ctx.reply(
    'Admin panel:\n' +
    '/total-user - Show total number of users\n' +
    '/view-<user_id> - View user profile by telegram ID\n' +
    '/promote-<user_id> - Promote user to admin\n' +
    '/status - Check database connection status'
  );
};