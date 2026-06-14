const Admin = require("../models/Admin");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const ROLES = require("../constants/roles");

const MAX_PAGE_SIZE = 100;

class NotificationService {
  async createForRecipient(recipientId, recipientRole, notificationData) {
    const payload = { recipientId, recipientRole, ...notificationData };

    if (!payload.deduplicationKey) {
      return await Notification.create(payload);
    }

    return await Notification.findOneAndUpdate(
      {
        recipientId,
        recipientRole,
        deduplicationKey: payload.deduplicationKey,
      },
      { $setOnInsert: payload },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async notifyChef(chefId, notificationData) {
    return await this._safelyCreate(() =>
      this.createForRecipient(chefId, ROLES.CHEF, notificationData)
    );
  }

  async notifyAdmins(notificationData) {
    return await this._safelyCreate(async () => {
      const admins = await Admin.find({ status: "active" }).select("_id").lean();
      return await Promise.all(
        admins.map((admin) =>
          this.createForRecipient(admin._id, ROLES.ADMIN, notificationData)
        )
      );
    });
  }

  async getNotifications(recipientId, recipientRole, query = {}) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(query.limit, 10) || 20, 1),
      MAX_PAGE_SIZE
    );

    const filter = { recipientId, recipientRole };
    if (query.unread === "true") filter.readAt = null;
    if (query.type) filter.type = query.type;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientId, recipientRole, readAt: null }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async getUnreadCount(recipientId, recipientRole) {
    return await Notification.countDocuments({
      recipientId,
      recipientRole,
      readAt: null,
    });
  }

  async markAsRead(notificationId, recipientId, recipientRole) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId, recipientRole },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    return notification;
  }

  async markAllAsRead(recipientId, recipientRole) {
    const result = await Notification.updateMany(
      { recipientId, recipientRole, readAt: null },
      { readAt: new Date() }
    );

    return { updatedCount: result.modifiedCount };
  }

  async deleteNotification(notificationId, recipientId, recipientRole) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId,
      recipientRole,
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }
  }

  async _safelyCreate(createNotifications) {
    try {
      return await createNotifications();
    } catch (error) {
      console.error("Failed to create notification:", error.message);
      return null;
    }
  }
}

module.exports = new NotificationService();
