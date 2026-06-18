const sendEmail = require("./sendEmail");

/**
 * Sends notification emails when a delivery person is assigned to an order.
 * @param {Object} order - The populated order object.
 * @param {Object} delivery - The delivery person object.
 * @param {Object} customer - The customer object.
 */
const sendDeliveryAssignmentEmails = async (order, delivery, customer) => {
  // Group items by chef to handle multiple pickups
  const itemsByChef = new Map();
  order.items.forEach((item) => {
    const chefId = item.chefId._id.toString();
    if (!itemsByChef.has(chefId)) {
      itemsByChef.set(chefId, {
        chef: item.chefId,
        items: [],
      });
    }
    itemsByChef.get(chefId).items.push(item);
  });

  // 1. Email to Delivery Person
  const deliverySubject = `New Delivery Assignment: Order #${order._id}`;

  let pickupInstructions = "";
  itemsByChef.forEach(({ chef, items }) => {
    const itemsText = items
      .map((item) => `  - ${item.name} (x${item.quantity}) [Status: ${item.status}]`)
      .join("\n");
    
    pickupInstructions += `
Chef: ${chef.kitchenName || chef.firstName + " " + chef.lastName}
Phone: ${chef.phone || "N/A"}
Kitchen Address: ${chef.kitchenAddress || "Address not provided"}
Items to pick up:
${itemsText}
`;
  });

  const deliveryMessage = `
Hello ${delivery.firstName},

You have been assigned a new delivery.

Order Details:
Order ID: ${order._id}
Customer Phone: ${order.contactPhone}
Shipping Address: ${order.shippingAddress}

Pickup Locations:
${pickupInstructions}

Total Amount: ${order.totalAmount} EGP

Please proceed to the kitchen addresses listed above to pick up the items.
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

  // 3. Emails to Chefs
  const chefEmails = [];
  itemsByChef.forEach(({ chef, items }) => {
    const chefSubject = `Delivery Person Assigned for Order #${order._id}`;
    const itemsList = items.map((item) => `- ${item.name} (x${item.quantity})`).join("\n");
    
    const chefMessage = `
Hello ${chef.firstName},

A delivery person has been assigned to pick up items for order #${order._id}.

Delivery Person Details:
Name: ${delivery.firstName} ${delivery.lastName}
Phone: ${delivery.phone}

Items for Pickup:
${itemsList}

Please have these items ready for pickup.
`;
    chefEmails.push(sendEmail(chef.email, chefSubject, chefMessage));
  });

  // Send all emails
  try {
    await Promise.all([
      sendEmail(delivery.email, deliverySubject, deliveryMessage),
      sendEmail(customer.email, customerSubject, customerMessage),
      ...chefEmails,
    ]);
    console.log(`Notification emails sent for order ${order._id}`);
  } catch (error) {
    console.error("Failed to send delivery notification emails:", error.message);
  }
};

module.exports = { sendDeliveryAssignmentEmails };
