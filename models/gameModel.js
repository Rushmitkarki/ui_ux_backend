const mongoose = require("mongoose");

const gameModel = mongoose.Schema({
  gameName: {
    type: String,
    required: true,
  },
  gameType: {
    type: String,
    required: true,
  },
  gameDescription: {
    type: String,
    required: true,
  },
  gamePrice: {
    type: Number,
    required: true,
  },
  gameImage: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});
const Game = mongoose.model("Game", gameModel);
module.exports = Game;
