const path = require("path");
const fs = require("fs");

const gameModel = require("../models/gameModel");
const createGame = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.files);

    const { gameName, gameType, gameDescription, gamePrice } = req.body;
    const { gameImage } = req.files;

    // Validation for required fields
    if (!gameName || !gameType || !gameDescription || !gamePrice) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!gameImage) {
      return res.status(400).json({
        success: false,
        message: "Game image is required",
      });
    }

    let imageName = null;

    // Validate if an image is uploaded

    imageName = `${Date.now()}_${gameImage.name}`;
    const imageUploadPath = path.join(__dirname, `../public/game/${imageName}`);
    gameImage.mv(imageUploadPath);

    // Save the game to the database
    const newGame = new gameModel({
      gameName,
      gameType,
      gameDescription,
      gamePrice,
      gameImage: imageName,
    });
    const game = await newGame.save();

    res.status(201).json({
      success: true,
      message: "Game created successfully",
      game,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

// fetch all games
const fetchAllGames = async (req, res) => {
  try {
    const allGames = await gameModel.find();
    res.status(200).json({
      success: true,
      message: "All games fetched successfully",
      games: allGames,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};
// fetch single game
const getSingleGame = async (req, res) => {
  const { gameId } = req.params;
  try {
    const game = await gameModel.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Game fetched successfully",
      game: game,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};
// detele game

const deleteGame = async (req, res) => {
  try {
    await gameModel.findByIdAndDelete(req.params.gameId);
    res.status(200).json({
      success: true,
      message: "Game deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};
// update game
const updateGame = async (req, res) => {
  try {
    if (req.files && req.files.gameImage) {
      const { gameImage } = req.files;
      const imageName = `${Date.now()}_${gameImage.name}`;
      const imageUploadPath = path.join(
        __dirname,
        `../public/game/${imageName}`
      );
      await gameImage.mv(imageUploadPath);
      req.body.gameImage = imageName;

      if (req.body.gameImage) {
        const existingGame = await gameModel.findById(req.params.gameId);
        const oldImagePath = path.join(
          __dirname,
          `../public/game/${existingGame.gameImage}`
        );
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update the data
    const updatedGame = await gameModel.findByIdAndUpdate(
      req.params.gameId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Game updated successfully",
      game: updatedGame,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

module.exports = {
  createGame,
  fetchAllGames,
  getSingleGame,
  deleteGame,
  updateGame,
};
