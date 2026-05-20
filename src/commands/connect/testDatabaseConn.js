const mongoose = require('mongoose');

// Command to check database connection status
const statusCommand = async (ctx) => {
  const isConnected = mongoose.connection.readyState === 1;
  
  if (isConnected) {
    ctx.reply('✅ Database is connected');
  } else {
    ctx.reply('❌ Database is NOT connected');
  }
};

module.exports = statusCommand;

