require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/database/database');

const clearNonAdminUsers = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Unable to connect to the database.');
    process.exit(1);
  }

  try {
    const result = await User.deleteMany({
      role: { $ne: 'admin' }
    });

    console.log('Non-admin users cleared successfully.');
    console.log(`- Users deleted: ${result.deletedCount}`);
    console.log('- Admin users were kept.');
  } catch (err) {
    console.error('Error clearing non-admin users:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

clearNonAdminUsers();
