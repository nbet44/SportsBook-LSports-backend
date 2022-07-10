const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");

router.post("/get-self", userController.getProfile);
router.post("/get-balance", userController.getBalance);
router.post("/get-betlist", userController.getBetList);
router.post("/get-login", userController.getLoginHistory);
router.post("/get-transaction", userController.getTransaction);
module.exports = router;