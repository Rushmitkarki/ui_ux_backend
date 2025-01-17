const Friend = require("../models/friendModel");
const User = require("../models/userModel");

const sendFriendRequest = async (req, res) => {
  const { requesterId, recipientId } = req.body;
  if (!requesterId || !recipientId) {
    return res.status(400).json({
      success: false,
      message: "Both requesterId and recipientId are required",
    });
  }

  try {
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({
        success: false,
        message: "Requester not found",
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    const existingFriend = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });
    if (existingFriend) {
      return res.status(400).json({
        success: false,
        message: "Friend request already sent",
      });
    }

    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
    });
    await friendRequest.save();

    recipient.friends.push(friendRequest);
    requester.friends.push(friendRequest);

    await recipient.save();
    await requester.save();

    return res.status(201).json({
      success: true,
      message: "Friend request sent",
    });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const acceptFriendRequest = async (req, res) => {
  const { friendId } = req.params;

  try {
    const friendRequest = await Friend.findById(friendId);

    if (!friendRequest || friendRequest.status !== "requested") {
      return res
        .status(404)
        .json({ message: "Friend request not found or already accepted." });
    }

    // Update the friend request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    res.status(200).json({
      message: "Friend request accepted.",
      friendRequest,
      succes: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Error accepting friend request.", error });
  }
};
const removeFriend = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  try {
    const friend = await Friend.findById(id);

    if (!friend || friend.status !== "accepted") {
      return res
        .status(404)
        .json({ message: "Friend not found or already removed." });
    }

    // Remove the friend record
    await friend.findByIdAndDelete();

    res.status(200).json({ message: "Friend removed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error removing friend.", error });
  }
};
// fetch remove friend
const fetchRemoveFriend = async (req, res) => {
  const id = req.user;

  try {
    const removeFriends = await Friend.find({
      $or: [{ requester: id }, { recipient: id }],
      status: "accepted",
    }).populate(
      "requester recipient",
      "firstName lastName profilePicture email"
    );

    res.status(200).json(removeFriends);
  } catch (error) {
    res.status(500).json({ message: "Error fetching remove friends.", error });
  }
};

const blockFriend = async (req, res) => {
  const { friendId } = req.params;

  try {
    const friend = await Friend.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found." });
    }

    // Update the status to "blocked"
    friend.status = "blocked";
    await friend.save();

    res.status(200).json({ message: "Friend blocked successfully.", friend });
  } catch (error) {
    res.status(500).json({ message: "Error blocking friend.", error });
  }
};
const fetchFriends = async (req, res) => {
  const userId = req.user.id;

  try {
    const friends = await Friend.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
    }).populate(
      "requester recipient",
      "firstName lastName profilePicture email"
    );

    // Transform the friends array to the desired format
    const formattedFriends = friends.map((friendship) => {
      // Determine which user is the friend (not the current user)
      const friend =
        friendship.requester._id.toString() === userId
          ? friendship.recipient
          : friendship.requester;

      return {
        _id: friendship._id,
        status: friendship.status,
        friend: {
          _id: friend._id,
          firstName: friend.firstName,
          lastName: friend.lastName,
          profilePicture: friend.profilePicture,
          email: friend.email,
        },
        timestamp: friendship.createdAt, // Assuming you have a timestamp field
      };
    });

    res.status(200).json(formattedFriends);
  } catch (error) {
    res.status(500).json({ message: "Error fetching friends.", error });
  }
};

// fetch friend requests
const fetchFriendRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    const friendRequests = await Friend.find({
      recipient: userId,
      status: "requested",
    }).populate("requester", "firstName lastName profilePicture email");

    res.status(200).json(friendRequests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching friend requests.", error });
  }
};
// fetch block users
const fetchBlockUsers = async (req, res) => {
  const id = req.user;

  try {
    const blockUsers = await Friend.find({
      $or: [{ requester: id }, { recipient: id }],
      status: "blocked",
    }).populate(
      "requester recipient",
      "firstName lastName profilePicture email"
    );

    res.status(200).json(blockUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching block users.", error });
  }
};

// unblock friend
const unblockFriend = async (req, res) => {
  const { friendId } = req.params;

  try {
    const friend = await Friend.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found." });
    }

    // Update the status to "unblocked"
    friend.status = "unblocked";
    await friend.save();

    res.status(200).json({ message: "Friend unblocked successfully.", friend });
  } catch (error) {
    res.status(500).json({ message: "Error unblocking friend.", error });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  blockFriend,
  fetchFriends,
  fetchFriendRequests,
  fetchBlockUsers,
  unblockFriend,
  fetchRemoveFriend,
};
