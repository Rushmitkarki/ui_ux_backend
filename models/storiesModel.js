// models/Story.js
const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },

    title: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => Date.now() + 24 * 60 * 60 * 1000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", StorySchema);
