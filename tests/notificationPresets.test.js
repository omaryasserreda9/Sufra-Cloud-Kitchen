const test = require("node:test");
const assert = require("node:assert/strict");
const {
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  notificationPresets,
} = require("../src/constants/notificationPresets");

test("chef order preset is urgent and actionable", () => {
  const notification = notificationPresets.chefOrderRequest({
    orderId: "order-123",
    itemCount: 2,
    totalAmount: 350,
  });

  assert.equal(notification.type, NOTIFICATION_TYPES.CHEF_ORDER_REQUEST);
  assert.equal(notification.priority, NOTIFICATION_PRIORITIES.URGENT);
  assert.equal(notification.actionPath, "/chef/orders/order-123");
  assert.match(notification.body, /2 meal requests/);
});

test("low meal ratings receive higher priority", () => {
  const lowRating = notificationPresets.chefMealReview({
    mealName: "Koshari",
    rating: 2,
    reviewId: "review-123",
  });
  const highRating = notificationPresets.chefMealReview({
    mealName: "Koshari",
    rating: 5,
    reviewId: "review-456",
  });

  assert.equal(lowRating.priority, NOTIFICATION_PRIORITIES.HIGH);
  assert.equal(highRating.priority, NOTIFICATION_PRIORITIES.NORMAL);
});

test("admin contact preset includes the sender and subject", () => {
  const notification = notificationPresets.adminContactMessage({
    senderName: "Customer Name",
    subject: "Order complaint",
    messageId: "message-123",
  });

  assert.equal(notification.type, NOTIFICATION_TYPES.ADMIN_CONTACT_MESSAGE);
  assert.equal(notification.actionPath, "/admin/contact/message-123");
  assert.match(notification.body, /Customer Name: Order complaint/);
});
