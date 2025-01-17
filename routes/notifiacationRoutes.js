const express = require("express");
const router = express.Router();
const {
  createNotification,
  getNotifications,
  markAsRead,
} = require("../controllers/notificationController");
const { authGuard } = require("../middleware/authGuard");

router.post("/create_notification", createNotification);
router.get("/get_notifications", authGuard, getNotifications);
router.put("/:notificationId", markAsRead);

module.exports = router;
