require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/database/database');

const clearDatabase = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Unable to connect to the database.');
    process.exit(1);
  }

  try {
    const result = await User.deleteMany({});
    console.log(`Cleared ${result.deletedCount} user(s) from the database.`);
  } catch (err) {
    console.error('Error clearing the database:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

clearDatabase();
