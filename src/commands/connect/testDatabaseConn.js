const mongoose = require('mongoose');

// Command to check database connection status
const statusCommand = async (ctx) => {
  const isConnected = mongoose.connection.readyState === 1;
  
  if (isConnected) {
    ctx.reply('✅ database បានភ្ជាប់ជោគជ័យ។');
  } else {
    ctx.reply('❌ មិនអាចភ្ជាប់ដេតាបាសបាន។');
  }
};

module.exports = statusCommand;

