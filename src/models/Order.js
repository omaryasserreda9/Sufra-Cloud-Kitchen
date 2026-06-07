const mongoose = require("mongoose");
const ORDER_STATUS = require("../constants/orderStatus");
const ORDER_ITEM_STATUS = require("../constants/orderItemStatus");

const orderItemSchema = new mongoose.Schema(
  {
    mealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meal",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_ITEM_STATUS),
      default: ORDER_ITEM_STATUS.PREPARING,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PREPARING,
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    contactPhone: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate order status based on items
orderSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    const itemStatuses = this.items.map((item) => item.status);

    if (itemStatuses.every((status) => status === ORDER_ITEM_STATUS.DELIVERED)) {
      this.status = ORDER_STATUS.DELIVERED;
    } else if (
      itemStatuses.every(
        (status) =>
          status === ORDER_ITEM_STATUS.READY ||
          status === ORDER_ITEM_STATUS.DELIVERED
      )
    ) {
      this.status = ORDER_STATUS.OUT_FOR_DELIVERY;
    } else {
      this.status = ORDER_STATUS.PREPARING;
    }
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
