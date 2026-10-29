const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connect to MongoDB Atlas or local MongoDB instance.
 * Gracefully logs warning if disconnected in development.
 */
async function connectDB() {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/supermemory';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000, // Quick failover for offline dev/tests
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (err) {
    console.warn(`[Database] MongoDB connection notice: ${err.message}. Operating in resilient mode.`);
    return null;
  }
}

function getDbStatus() {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState
  };
}

module.exports = {
  connectDB,
  getDbStatus
};
