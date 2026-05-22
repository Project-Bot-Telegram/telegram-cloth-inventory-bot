require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Order = require('../src/models/Order');
const connectDB = require('../src/database/database');

const clearDatabase = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('Unable to connect to the database.');
    process.exit(1);
  }

  try {
    const [users, products, categories, orders, counters] = await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      mongoose.connection.collection('counters').deleteMany({})
    ]);

    console.log('Database cleared successfully.');
    console.log(`- Users: ${users.deletedCount}`);
    console.log(`- Products: ${products.deletedCount}`);
    console.log(`- Categories: ${categories.deletedCount}`);
    console.log(`- Orders: ${orders.deletedCount}`);
    console.log(`- Counters: ${counters.deletedCount}`);
  } catch (err) {
    console.error('Error clearing the database:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

clearDatabase();
