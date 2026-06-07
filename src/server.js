require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("Starting server...");

    await connectDB();

    console.log("DB connected, starting Express...");

    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (err) {
    console.error("Fatal startup error:", err);
    process.exit(1);
  }
};

startServer();