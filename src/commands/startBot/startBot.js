const connectDB = require('../../database/database');

const botShortDescription = 'Browse clothes, manage your cart, and place orders from Telegram.';
const botDescription = [
  'Telegram cloth inventory bot.',
  '',
  'Use /start to open the shop, register your profile, browse products, manage your cart, and place orders.'
].join('\n');

const startBot = async (bot) => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  await bot.telegram.deleteMyCommands();
  await bot.telegram.setMyShortDescription(botShortDescription);
  await bot.telegram.setMyDescription(botDescription);

  const botCommands = [
    { command: 'start', description: 'ចាប់ផ្តើម bot និងបង្ហាញ menu' },
    { command: 'status', description: 'check connection status' },
    { command: 'support', description: 'Contact support' },
    { command: 'help', description: 'Show help information' },
    { command: 'admin', description: 'Admin functions and management' },
    { command: 'totaluser', description: 'Show total registered users' }
  ];

  await bot.telegram.setMyCommands(botCommands);
  await bot.telegram.setChatMenuButton({ menuButton: { type: 'commands' } });
  await bot.launch();
  console.log('Bot launched successfully');
};

module.exports = startBot;
