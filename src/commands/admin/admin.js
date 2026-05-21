module.exports = async (ctx) => {
  ctx.reply(
    'Admin panel:\n' +
    'Use the Add Product and Add Category buttons from the main menu to start a guided creation flow.\n' +
    '/total-user - Show total number of users\n' +
    '/view-<user_id> - View user profile by telegram ID\n' +
    '/promote-<user_id> - Promote user to admin\n' +
    '/status - Check database connection status'
  );
};