const mongoose = require('mongoose');

const connectDB = async (opts = {}) => {
  const uri = process.env.MONGO_URI;
  const maxAttempts = opts.maxAttempts || 5;
  const baseDelay = opts.baseDelay || 1000; // ms

  const mongooseOpts = Object.assign({
    // reduce how long the driver waits for server selection/connect
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  }, opts.mongooseOptions || {});

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri, mongooseOpts);
      console.log('✅ MongoDB connected');
      return true;
    } catch (err) {
      console.error(`❌ MongoDB connection failed (attempt ${attempt}/${maxAttempts}):`, err && err.message ? err.message : err);
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      console.error('All MongoDB connection attempts failed.');
      return false;
    }
  }
};

module.exports = connectDB;