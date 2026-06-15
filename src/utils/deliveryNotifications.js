const sendEmail = require("./sendEmail");

/**
 * Sends notification emails when a delivery person is assigned to an order.
 * @param {Object} order - The populated order object.
 * @param {Object} delivery - The delivery person object.
 * @param {Object} customer - The customer object.
 */
const sendDeliveryAssignmentEmails = async (order, delivery, customer) => {
  // 1. Email to Delivery Person
  const deliverySubject = `New Delivery Assignment: Order #${order._id}`;
  
  const itemsList = order.items
    .map((item) => `- ${item.name} (x${item.quantity})`)
    .join("\n");

  const deliveryMessage = `
Hello ${delivery.firstName},

You have been assigned a new delivery.

Order Details:
Order ID: ${order._id}
Customer Phone: ${order.contactPhone}
Shipping Address: ${order.shippingAddress}

Items:
${itemsList}

Total Amount: ${order.totalAmount} EGP

Please proceed to the kitchen to pick up the order.
`;

  // 2. Email to Customer
  const customerSubject = "Delivery Person Assigned to Your Order";
  const customerMessage = `
Hello ${customer.firstName},

Good news! A delivery person has been assigned to your order #${order._id}.

Delivery Details:
Name: ${delivery.firstName} ${delivery.lastName}
Phone: ${delivery.phone}

Your order is on its way!
Please provide this OTP to the delivery person to complete your order: ${order.otp}
`;

  // Send emails in parallel
  try {
    await Promise.all([
      sendEmail(delivery.email, deliverySubject, deliveryMessage),
      sendEmail(customer.email, customerSubject, customerMessage),
    ]);
    console.log(`Notification emails sent for order ${order._id}`);
  } catch (error) {
    console.error("Failed to send delivery notification emails:", error.message);
  }
};

module.exports = { sendDeliveryAssignmentEmails };
