const express = require('express');
const router = express.Router();
const mohioController = require("../controller/mohioController");

router.post("/accountdetails", mohioController.getAccountAction);
router.post("/balance", mohioController.getBalanceAction);
router.post("/debit", mohioController.debitAction);
router.post("/credit", mohioController.creditAction);
router.post("/cancel", mohioController.cancelAction);
router.post("/get-token", mohioController.getTokenAction);
router.post("/casino-history", mohioController.casinoHistoryAction);

module.exports = router;