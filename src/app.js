const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");


const errorMiddleware = require("./middlewares/error.middleware");
const connectDB = require("./config/database");



const authRoutes = require("./routes/auth.routes");
const chefRoutes = require("./routes/chef.routes");
const verificationRoutes = require("./routes/chefVerification.routes");
const mealRoutes = require("./routes/meal.routes");
const categoryRoutes = require("./routes/category.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors());

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("dev"));

// Health Check
app.get("/", async (req, res) => {
  try {
    console.log("Trying Mongo connection...");

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB Connected:", conn.connection.host);

    return res.status(200).json({
      success: true,
      message: "Welcome to the Meal Delivery API",
      mongoState: "connected",
      host: conn.connection.host,
    });
  } catch (err) {
    console.log("MongoDB Error:", err.message);

    return res.status(500).json({
      success: false,
      message: "MongoDB connection failed",
      mongoState: "error",
      error: err.message,
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chefs", chefRoutes);
app.use("/api/verification-request", verificationRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

module.exports = app;
