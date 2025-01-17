const router = require("express").Router();
const { authGuard } = require("../middleware/authGuard");
const {
  createChat,
  getChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  leaveFromGroup,
  updateGroup,
  uploadGroupImage,
  updateGroupImage,
} = require("../controllers/chatController");

router.post("/create", authGuard, createChat);
router.get("/fetch", authGuard, getChats);
router.post("/group", authGuard, createGroupChat);
router.put("/rename", authGuard, renameGroup);
router.put("/groupadd", authGuard, addToGroup);
router.put("/groupremove", authGuard, removeFromGroup);
// leave from group
router.put("/groupleave", authGuard, leaveFromGroup);
// updategroup
router.put("/updategroup", authGuard, updateGroup);

// uploadGroupImage
router.post("/uploadgroupimage", uploadGroupImage);

// updateGroupImage
router.put("/updategroupimage", updateGroupImage);

module.exports = router;
