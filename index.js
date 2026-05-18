require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const connectDB = require('./src/database/database');

const bot = new Telegraf(process.env.BOT_TOKEN);

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

// /start bot command handler
bot.start((ctx) => {
  ctx.reply('Welcome! Use /status to check database connection');
});

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