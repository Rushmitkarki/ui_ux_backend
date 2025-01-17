const router = require("express").Router();
const gameController = require("../controllers/gameController");

router.post("/create", gameController.createGame);

// fetch all games
router.get("/get_all_game", gameController.fetchAllGames);

// fetch single game
router.get("/get_single_game/:gameId", gameController.getSingleGame);

// delete game
router.delete("/delete_game/:gameId", gameController.deleteGame);

// update game
router.put("/update_game/:gameId", gameController.updateGame);

module.exports = router;
