const express = require("express");
const router = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  blockFriend,
  fetchFriends,
  fetchFriendRequests,
  fetchBlockUsers,
  unblockFriend,
} = require("../controllers/friendControllers");
const { authGuard } = require("../middleware/authGuard");

// Routes
router.post("/friend_send", authGuard, sendFriendRequest); // Send friend request
router.put("/accept_friend/:friendId", authGuard, acceptFriendRequest); // Accept friend request
router.delete("/remove_friend", authGuard, removeFriend); // Remove friend
router.put("/block_friend/:friendId", authGuard, blockFriend); // Block friend
router.get("/friend_list", authGuard, fetchFriends); // Fetch friends
router.get("/fetch_friend_requests", authGuard, fetchFriendRequests); // Fetch friend requests
router.get("/fetch_block_users", authGuard, fetchBlockUsers); // Fetch block users
router.put("/unblock_friend/:friendId", authGuard, unblockFriend); // Unblock friend

module.exports = router;
