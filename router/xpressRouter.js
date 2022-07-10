const express = require('express');
const router = express.Router();
const xpressController = require("../controller/xpressController");

router.post("/login", xpressController.loginAction);
router.post("/balance", xpressController.getBalanceAction);
router.post("/debit", xpressController.debitAction);
router.post("/credit", xpressController.creditAction);
router.post("/rollback", xpressController.rollbackAction);
router.post("/logout", xpressController.logoutAction);
router.post("/get-token", xpressController.getTokenAction);
router.post("/casino-history", xpressController.casinoHistoryAction);

module.exports = router;