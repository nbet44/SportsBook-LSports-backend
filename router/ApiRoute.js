const express = require('express');
const router = express.Router();
const token = require("../middleware/token");

const authRouter = require("./authRouter");
const agentRouter = require("./agentRouter");
const sportsRouter = require("./sportsRouter");
const xpressRouter = require("./xpressRouter");
const mohioRouter = require("./mohioRouter");
const userRouter = require("./userRouter");

router.use("/auth", authRouter);
router.use("/agent", token.check_token, agentRouter);
router.use("/sports", token.check_token, sportsRouter);
router.use("/user", token.check_token, userRouter);
router.use("/mohio", mohioRouter);
router.use("/Xpress", xpressRouter);

module.exports = router;