const ContactMessage = require("../models/ContactMessage");
const ApiError = require("../utils/ApiError");

class ContactService {
  /**
   * Submit a new contact message.
   */
  async submitMessage(senderId, senderRole, messageData) {
    const { fullName, email, subject, message } = messageData;

    // Determine the model name for refPath (null for guests)
    const senderRoleModel = senderRole !== "guest" 
      ? senderRole.charAt(0).toUpperCase() + senderRole.slice(1)
      : null;

    const contactMessage = await ContactMessage.create({
      senderId,
      senderRole,
      senderRoleModel,
      fullName,
      email,
      subject,
      message,
    });

    return contactMessage;
  }

  /**
   * Get all contact messages, pending first.
   */
  async getAllMessages() {
    // Sort by status (pending first) and then by createdAt (newest first)
    // In alphabetical order 'finished' > 'pending', but we want pending first.
    // We can use a custom sort or just sort by createdAt and handle status logic.
    // Better way in mongoose: 
    return await ContactMessage.find().sort({ status: -1, createdAt: -1 });
  }

  /**
   * Update message status to finished.
   */
  async markAsFinished(messageId) {
    const message = await ContactMessage.findById(messageId);

    if (!message) {
      throw new ApiError(404, "Contact message not found");
    }

    message.status = "finished";
    await message.save();

    return message;
  }
}

module.exports = new ContactService();
