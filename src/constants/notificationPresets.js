const NOTIFICATION_TYPES = {
  ADMIN_VERIFICATION_REQUEST: "admin.verification.requested",
  ADMIN_CONTACT_MESSAGE: "admin.contact.received",
  ADMIN_WITHDRAWAL_REQUEST: "admin.withdrawal.requested",
  CHEF_VERIFICATION_UPDATED: "chef.verification.updated",
  CHEF_ACCOUNT_STATUS_UPDATED: "chef.account.status_updated",
  CHEF_ORDER_REQUEST: "chef.order.requested",
  CHEF_MEAL_REVIEW: "chef.meal.reviewed",
  CHEF_WITHDRAWAL_UPDATED: "chef.withdrawal.updated",
};

const NOTIFICATION_PRIORITIES = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
};

const notificationPresets = {
  adminVerificationRequest: ({ chefName, requestId }) => ({
    type: NOTIFICATION_TYPES.ADMIN_VERIFICATION_REQUEST,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    title: "Chef verification needs review",
    body: `${chefName} submitted a verification request.`,
    actionPath: `/admin/verifications/${requestId}`,
  }),

  adminContactMessage: ({ senderName, subject, messageId }) => ({
    type: NOTIFICATION_TYPES.ADMIN_CONTACT_MESSAGE,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    title: "New contact message",
    body: `${senderName}: ${subject}`,
    actionPath: `/admin/contact/${messageId}`,
  }),

  adminWithdrawalRequest: ({ chefName, amount, withdrawalId }) => ({
    type: NOTIFICATION_TYPES.ADMIN_WITHDRAWAL_REQUEST,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    title: "Withdrawal request needs review",
    body: `${chefName} requested ${amount} EGP.`,
    actionPath: `/admin/withdrawals/${withdrawalId}`,
  }),

  chefVerificationUpdated: ({ status, requestId }) => ({
    type: NOTIFICATION_TYPES.CHEF_VERIFICATION_UPDATED,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    title: "Verification status updated",
    body: `Your verification request is now ${status}.`,
    actionPath: `/chef/verification/${requestId}`,
  }),

  chefAccountStatusUpdated: ({ status }) => ({
    type: NOTIFICATION_TYPES.CHEF_ACCOUNT_STATUS_UPDATED,
    priority: NOTIFICATION_PRIORITIES.URGENT,
    title: "Account status updated",
    body: `Your chef account is now ${status}.`,
    actionPath: "/chef/profile",
  }),

  chefOrderRequest: ({ orderId, itemCount, totalAmount }) => ({
    type: NOTIFICATION_TYPES.CHEF_ORDER_REQUEST,
    priority: NOTIFICATION_PRIORITIES.URGENT,
    title: "New customer order",
    body: `You received ${itemCount} meal request${itemCount === 1 ? "" : "s"} worth ${totalAmount} EGP.`,
    actionPath: `/chef/orders/${orderId}`,
  }),

  chefMealReview: ({ mealName, rating, reviewId }) => ({
    type: NOTIFICATION_TYPES.CHEF_MEAL_REVIEW,
    priority: rating <= 2 ? NOTIFICATION_PRIORITIES.HIGH : NOTIFICATION_PRIORITIES.NORMAL,
    title: "New meal review",
    body: `${mealName} received a ${rating}-star review.`,
    actionPath: `/chef/reviews/${reviewId}`,
  }),

  chefWithdrawalUpdated: ({ status, amount, withdrawalId }) => ({
    type: NOTIFICATION_TYPES.CHEF_WITHDRAWAL_UPDATED,
    priority: NOTIFICATION_PRIORITIES.HIGH,
    title: "Withdrawal status updated",
    body: `Your ${amount} EGP withdrawal request was ${status}.`,
    actionPath: `/chef/withdrawals/${withdrawalId}`,
  }),
};

module.exports = {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  notificationPresets,
};
