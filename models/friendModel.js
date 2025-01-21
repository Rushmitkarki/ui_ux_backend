const mongoose = require("mongoose");
const user = require("./userModel");

const friendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["requested", "accepted", "blocked", "unblocked"],
    default: "requested",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
const Friend = mongoose.model("Friend", friendSchema);
module.exports = Friend;
