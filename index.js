require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');
const connectDB = require('./src/database/database');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

// ✅ Try to connect to MongoDB
// ✅ If connection succeeds → Launch the bot
const startBot = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  await bot.launch();
  console.log('🤖 Bot launched successfully');
};

const registerCommand = require('./src/commands/users/register');

bot.start(registerCommand);
bot.on('text', async (ctx, next) => {
  if (ctx.session && ctx.session.registration) {
    await registerCommand(ctx);
    return;
  }

  return next();
});

const profileCommand = require('./src/commands/users/profile');
const authMiddleware = require('./src/middleware/auth');

bot.command('profile', authMiddleware, profileCommand);

const roleMiddleware = require('./src/middleware/role');
const adminCommand = require('./src/commands/admin');

bot.command(
  'admin',
  roleMiddleware,
  adminCommand
);

// Command to check database connection status
bot.command('status', async (ctx) => {
  const isConnected = mongoose.connection.readyState === 1;
  
  if (isConnected) {
    ctx.reply('✅ Database is connected');
  } else {
    ctx.reply('❌ Database is NOT connected');
  }
});

startBot().catch((err) => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});

module.exports = { bot };