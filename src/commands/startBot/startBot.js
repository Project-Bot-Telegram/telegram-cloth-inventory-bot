const connectDB = require('../../database/database');

// ✅ Try to connect to MongoDB
// ✅ If connection succeeds → Launch the bot
const startBot = async (bot) => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  await bot.launch();
  console.log('🤖 Bot launched successfully');
};

module.exports = startBot;
