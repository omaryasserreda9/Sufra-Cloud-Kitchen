const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return "already connected";
  }

  await mongoose.connect(process.env.MONGODB_URI);

  isConnected = true;

  return "connected";
};

module.exports = connectDB;