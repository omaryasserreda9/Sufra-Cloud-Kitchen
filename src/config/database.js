const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB Cluster...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Cluster Connected successfully..");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
  }
};

module.exports = connectDB;
