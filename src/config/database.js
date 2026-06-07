const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("Connecting to MongoDB...");
  console.log("URI exists:", !!process.env.MONGODB_URI);

  const conn = await mongoose.connect(process.env.MONGODB_URI);

  console.log("MongoDB Connected:", conn.connection.host);
};

module.exports = connectDB;