// Command to display help information about how to use the bot
const helpCommand = async (ctx) => {
  return ctx.reply(
    'Use buttons for most actions and commands only when needed:\n\n' +
    '• Show product - Browse categories and products\n' +
    '• View Profile - Check your profile\n' +
    '• Orders History - View your order history\n' +
    '• Support - Contact support\n\n' +
    '/search <field> <query> - Search products\n'
  );
};

module.exports = helpCommand;
