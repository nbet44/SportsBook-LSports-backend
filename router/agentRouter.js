const express = require('express');
const router = express.Router();
const agentController = require("../controller/agentController");

router.post("/get", agentController.getAgentAction);
router.post("/remove", agentController.removeAgentAction);
router.post("/get-users", agentController.getUsersAction);
router.post("/get-token", agentController.getTokenAction);
router.post("/update-balance", agentController.updateBalance);
router.post("/get-transaction", agentController.getTransaction);
router.post("/update-password", agentController.updatePassword);
router.post("/update-user", agentController.updateUser);
module.exports = router;