const express = require("express");
const router = express.Router();
const {
  addStory,
  editStory,
  deleteStory,
  getAllStories,
} = require("../controllers/storiesControllers");
const { authGuard } = require("../middleware/authGuard");

router.post("/create", authGuard, addStory);
router.put("/edit_story/:id", authGuard, editStory);
router.delete("/delete_story/:id", authGuard, deleteStory);
router.get("/get_all_stories", authGuard, getAllStories);

module.exports = router;
