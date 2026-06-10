const contactService = require("../services/contact.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class ContactController {
  /**
   * Submit a contact message (Chef or Customer).
   */
  submitMessage = asyncHandler(async (req, res) => {
    const senderId = req.user._id;
    const senderRole = req.user.role;
    
    const message = await contactService.submitMessage(senderId, senderRole, req.body);

    res.status(201).json(
      new ApiResponse(201, message, "Contact message submitted successfully")
    );
  });

  /**
   * Get all contact messages (Admin only).
   */
  getAllMessages = asyncHandler(async (req, res) => {
    const messages = await contactService.getAllMessages();

    res.status(200).json(
      new ApiResponse(200, messages, "Contact messages retrieved successfully")
    );
  });

  /**
   * Mark message as finished (Admin only).
   */
  markAsFinished = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const message = await contactService.markAsFinished(id);

    res.status(200).json(
      new ApiResponse(200, message, "Contact message marked as finished")
    );
  });
}

module.exports = new ContactController();
