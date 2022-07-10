const express = require('express');
const router = express.Router();
const sportsController = require("../controller/sportsController");

router.post("/get-all-markets", sportsController.getAllMarketAction);
router.post("/get-all-matches", sportsController.getAllMatchAction);
router.post("/get-all-league", sportsController.getAllLeagueAction);
router.post("/get-all-sport", sportsController.getAllSportAction);
// router.post("/get-result", sportsController.getResultAction);
router.post("/bet-history", sportsController.getHistoryAction);
router.post("/set-result", sportsController.setResultAction);
router.post("/set-live-result", sportsController.setLiveResultAction);
router.post("/get-favorite", sportsController.getFavoriteAction);
router.post("/save-favorite", sportsController.saveFavoriteAction);




router.post("/clear-inplay", sportsController.clearInplay)
router.post("/clear-prematch", sportsController.clearPrematch)

// router.post("/user-bet", sportsController.userBetAction);
router.post("/user-bet", sportsController.userBet);

// router.post("/get-live", sportsController.getLiveAction);
router.post("/get-live", sportsController.getLive);

// router.post("/get-league", sportsController.getLeagueAction);
router.post("/get-league", sportsController.getLeague);

// router.post("/get-match", sportsController.getMatchAction);
router.post("/get-match", sportsController.getMatch);

// router.post("/get-today-match", sportsController.getTodayMatchAction);
router.post("/get-today-match", sportsController.getTodayMatch);

// router.post("/get-event", sportsController.getEventAction);
router.post("/get-event", sportsController.getEvent);

module.exports = router;