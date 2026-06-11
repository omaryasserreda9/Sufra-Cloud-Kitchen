const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      refPath: "senderRoleModel",
    },
    senderRole: {
      type: String,
      required: true,
      enum: ["customer", "chef", "guest"],
    },
    senderRoleModel: {
      type: String,
      required: false,
      enum: ["Customer", "Chef"],
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "finished"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
