require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/database/database');

const promoteTelegramId = process.argv[2];

if (!promoteTelegramId || isNaN(promoteTelegramId)) {
  console.error('Usage: npm run promote-admin <telegram_id>');
  console.error('Example: npm run promote-admin 1655512983');
  process.exit(1);
}

const promoteToAdmin = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Unable to connect to the database.');
    process.exit(1);
  }

  try {
    const user = await User.findOneAndUpdate(
      { telegram_id: parseInt(promoteTelegramId) },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log(`✅ User ${user.full_name} (${user.username}) promoted to admin.`);
    } else {
      console.log(`❌ User not found with telegram_id: ${promoteTelegramId}`);
    }
  } catch (err) {
    console.error('Error promoting user:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

promoteToAdmin();
