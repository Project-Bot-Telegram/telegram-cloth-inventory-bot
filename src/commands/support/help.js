// Command to display help information about how to use the bot
const helpCommand = async (ctx) => {
  return ctx.reply(
    'Use the bot commands below or type them directly:\n\n' +
    '/products - List all products\n' +
    '/product <name|id> - View product details\n' +
    '/order <product_id|name> <quantity> - Place an order\n' +
    '/orders - View your order history\n' +
    '/profile - View your profile\n' +
    '/search <field> <query> - Search products\n\n' +
    'Use the buttons below for quick actions:\n' +
    '• Show product - Browse categories and products\n' +
    '• Orders History - View your orders\n' +
    '• View Profile - Check your profile\n' +
    '• Support - Contact support'
  );
};

module.exports = helpCommand;
