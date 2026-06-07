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
    const state = mongoose.connection.readyState;

    res.status(200).json({
      success: true,
      message: "Welcome to the Meal Delivery API",
      mongoState:
        state === 1
          ? "connected"
          : state === 2
          ? "connecting"
          : "disconnected",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      mongoState: "error",
      error: err,
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
