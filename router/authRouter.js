const express = require('express');
const router = express.Router();
const authController = require("../controller/authController");
const token = require("../middleware/token");
const multer = require('multer');
const config = require("../config/index")
const BaseControll = require("../controller/baseController")
const path = require("path");

router.post("/login", authController.loginAction);
router.post("/change-password", token.check_token, authController.changePasswordAction);
router.post("/create-player", token.check_token, authController.createPlayerAction);
router.post("/create-agent", token.check_token, authController.createAgentAction);
router.post("/site-setting", token.check_token, authController.siteSettingAction);
router.post("/get-site-setting", token.check_token, authController.getSiteSettingAction);
router.post("/save-site-slider", token.check_token, multer({ dest: path.resolve("./uploads/") }).any(), BaseControll.imageupload, authController.saveSiteSlider);
router.post("/save-site-slider-file", token.check_token, authController.saveSiteSliderFile);
router.post("/remove-site-slider", token.check_token, authController.removeSiteSlider);
module.exports = router;