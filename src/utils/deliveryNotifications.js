const sendEmail = require("./sendEmail");

/**
 * Sends notification emails when a delivery person is assigned to an order.
 * @param {Object} order - The populated order object.
 * @param {Object} delivery - The delivery person object.
 * @param {Object} customer - The customer object.
 */
const sendDeliveryAssignmentEmails = async (order, delivery, customer) => {
  // Group items by chef
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

  // ================= Delivery Email =================
  const deliverySubject = `New Delivery Assignment: Order #${order._id}`;

  let pickupInstructions = "";

  itemsByChef.forEach(({ chef, items }) => {
    const itemsText = items
      .map(
        (item) =>
          `  - ${item.name} (x${item.quantity}) [Status: ${item.status}]`,
      )
      .join("\n");

    pickupInstructions += `
Chef: ${chef.kitchenName || `${chef.firstName} ${chef.lastName}`}
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

  // ================= Customer Email =================
  const customerSubject = "Delivery Person Assigned to Your Order";

  const customerMessage = `
Hello ${customer.firstName},

Good news! A delivery person has been assigned to your order #${order._id}.

Delivery Details:
Name: ${delivery.firstName} ${delivery.lastName}
Phone: ${delivery.phone}

Your order is on its way!

Please provide this OTP to the delivery person to complete your order:
${order.otp}
`;

  try {
    // Delivery email
    if (delivery.email) {
      console.log("Sending email to delivery:", delivery.email);

      await sendEmail(delivery.email, deliverySubject, deliveryMessage);

      console.log("✓ Delivery email sent");
    } else {
      console.error("Delivery email missing");
    }

    // Customer email
    if (customer.email) {
      console.log("Sending email to customer:", customer.email);

      await sendEmail(customer.email, customerSubject, customerMessage);

      console.log("✓ Customer email sent");
    } else {
      console.error("Customer email missing");
    }

    // Chef emails
    for (const { chef, items } of itemsByChef.values()) {
      try {
        console.log(
          "Chef:",
          chef.firstName,
          chef.lastName,
          "Email:",
          chef.email,
        );

        if (!chef.email) {
          console.error(`Chef ${chef.firstName} ${chef.lastName} has no email`);
          continue;
        }

        const chefSubject = `Delivery Person Assigned for Order #${order._id}`;

        const itemsList = items
          .map((item) => `- ${item.name} (x${item.quantity})`)
          .join("\n");

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

        await sendEmail(chef.email, chefSubject, chefMessage);

        console.log(`✓ Chef email sent to ${chef.firstName} ${chef.lastName}`);
      } catch (err) {
        console.error(
          `Failed sending email to chef ${chef.firstName} ${chef.lastName}`,
        );
        console.error(err);
      }
    }

    console.log(`Notification emails sent for order ${order._id}`);
  } catch (error) {
    console.error("Failed to send delivery notification emails:");
    console.error(error);
    console.error(error.stack);
  }
};

module.exports = { sendDeliveryAssignmentEmails };
