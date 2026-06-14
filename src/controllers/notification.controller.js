const notificationService = require("../services/notification.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class NotificationController {
  getNotifications = asyncHandler(async (req, res) => {
    const data = await notificationService.getNotifications(
      req.user._id,
      req.user.role,
      req.query
    );

    res
      .status(200)
      .json(new ApiResponse(200, data, "Notifications retrieved successfully"));
  });

  getUnreadCount = asyncHandler(async (req, res) => {
    const unreadCount = await notificationService.getUnreadCount(
      req.user._id,
      req.user.role
    );

    res
      .status(200)
      .json(new ApiResponse(200, { unreadCount }, "Unread count retrieved successfully"));
  });

  markAsRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res
      .status(200)
      .json(new ApiResponse(200, notification, "Notification marked as read"));
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    const result = await notificationService.markAllAsRead(
      req.user._id,
      req.user.role
    );

    res
      .status(200)
      .json(new ApiResponse(200, result, "All notifications marked as read"));
  });

  deleteNotification = asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res
      .status(200)
      .json(new ApiResponse(200, null, "Notification deleted successfully"));
  });
}

module.exports = new NotificationController();
