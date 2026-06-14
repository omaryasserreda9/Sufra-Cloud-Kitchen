const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/database");


const errorMiddleware = require("./middlewares/error.middleware");


const authRoutes = require("./routes/auth.routes");
const chefRoutes = require("./routes/chef.routes");
const verificationRoutes = require("./routes/chefVerification.routes");
const mealRoutes = require("./routes/meal.routes");
const categoryRoutes = require("./routes/category.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const settlementRoutes = require("./routes/settlement.routes");
const paymentRoutes = require("./routes/payment.routes");
const withdrawalRoutes = require("./routes/withdrawal.routes");
const reviewRoutes = require("./routes/review.routes");
const userRoutes = require("./routes/user.routes");
const contactRoutes = require("./routes/contact.routes");
const mealPlanningRoutes = require("./routes/mealPlanning.routes");
const deliveryRoutes = require("./routes/delivery.routes");

connectDB().catch(console.error);

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
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cloud Kitchen API Running..",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chefs", chefRoutes);
app.use("/api/verification-request", verificationRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/settlement", settlementRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/meal-planning", mealPlanningRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/delivery", deliveryRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

module.exports = app;
