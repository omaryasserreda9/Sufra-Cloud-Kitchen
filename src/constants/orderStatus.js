const ORDER_STATUS = {
  AWAITING_PAYMENT: "awaiting_payment",
  PREPARING: "preparing",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered", // Keeping for compatibility if needed, but COMPLETED will be the final state
  COMPLETED: "completed",
};

module.exports = ORDER_STATUS;
