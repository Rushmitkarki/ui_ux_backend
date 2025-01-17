const router = require("express").Router();
const {
  sendMessage,
  allMessages,
  saveFile,
} = require("../controllers/messageController");
const { authGuard } = require("../middleware/authGuard");

router.post("/send", authGuard, sendMessage);
router.get("/:chatId", authGuard, allMessages);
router.post("/send/file", saveFile);

module.exports = router;
