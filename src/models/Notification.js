const mongoose = require("mongoose");
const ROLES = require("../constants/roles");
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
} = require("../constants/notificationPresets");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      required: true,
      enum: [ROLES.ADMIN, ROLES.CHEF],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(NOTIFICATION_TYPES),
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(NOTIFICATION_PRIORITIES),
      default: NOTIFICATION_PRIORITIES.NORMAL,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    actionPath: {
      type: String,
      default: null,
      trim: true,
    },
    entityType: {
      type: String,
      default: null,
      trim: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    deduplicationKey: {
      type: String,
      default: null,
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, recipientRole: 1, createdAt: -1 });
notificationSchema.index(
  { recipientId: 1, recipientRole: 1, deduplicationKey: 1 },
  {
    unique: true,
    partialFilterExpression: { deduplicationKey: { $type: "string" } },
  }
);
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
