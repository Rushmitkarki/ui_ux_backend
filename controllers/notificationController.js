const Notification = require("../models/notificationModel");

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { sender, receiver, message, type, chatId } = req.body;

    const receivers = Array.isArray(receiver) ? receiver : [receiver];

    const notifications = await Promise.all(
      receivers.map(async (receiverId) => {
        const notification = new Notification({
          sender,
          receiver: receiverId,
          message,
          type,
          chatId,
          read: false,
          createdAt: new Date(),
        });
        return notification.save();
      })
    );

    // Populate sender details for frontend use
    const populatedNotifications = await Promise.all(
      notifications.map((notification) =>
        notification.populate([
          {
            path: "sender",
            select: "firstName lastName profilePicture",
          },
          {
            path: "receiver",
            select: "firstName lastName profilePicture",
          },
        ])
      )
    );

    res.status(201).json({
      success: true,
      notifications: populatedNotifications,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

// Get notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { id } = req.user;

    const notifications = await Notification.find({ receiver: id })
      .populate("sender", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

module.exports = { createNotification, getNotifications, markAsRead };
