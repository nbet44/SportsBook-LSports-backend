const authMiddlware = require("../middleware/token");
const baseController = require("./baseController");
const { userModel } = require("../models/userModel");
const { sessionModel } = require("../models/sessionModel");
const { loginHistoryModel } = require("../models/loginHistoryModel");
const { paymentHistoryModel } = require('../models/paymentHistoryModel');
const { siteSettingModel } = require('../models/siteSettingModel');

exports.removeSiteSlider = async (req, res, next) => {
    var data = req.body;
    var siteData = await baseController.BfindOne(siteSettingModel, { siteId: data.siteId });
    if (!siteData) {
        return res.json({ status: 300, data: "Invalid ID" });
    }
    var temp = siteData.file.filter(function (item) {
        return item.name !== data.file.name
    })
    await baseController.BfindOneAndUpdate(siteSettingModel, { siteId: data.siteId }, { file: temp });
    temp = siteData.sliderImages.filter(function (item) {
        return item.name !== data.file.name
    })
    isCheck = await baseController.BfindOneAndUpdate(siteSettingModel, { siteId: data.siteId }, { sliderImages: temp });
    return res.json({ status: 200, data: "" })
}

exports.saveSiteSliderFile = async (req, res, next) => {
    var data = req.body;
    var siteData = await baseController.BfindOne(siteSettingModel, { siteId: data.siteId });
    if (!siteData) {
        return res.json({ status: 300, data: "Invalid ID" });
    }
    var temp = siteData;
    if (!temp.file) {
        temp.file = []
    }
    temp.file.push(data.file)
    var isCheck = await baseController.BfindOneAndUpdate(siteSettingModel, { siteId: data.siteId }, {});
    console.log(isCheck)
    return res.json({ status: 200, data: "" });
}

exports.saveSiteSlider = async (req, res, next) => {
    var data = req.body;
    var file = JSON.parse(data.data)
    var siteData = await baseController.BfindOne(siteSettingModel, { siteId: data.siteId });
    if (!siteData) {
        return res.json({ status: 300, data: "Invalid ID" });
    }
    var temp = siteData;
    if (!temp.sliderImages) {
        temp.sliderImages = []
    }
    if (!temp.file) {
        temp.file = []
    }
    temp.sliderImages.push(data.images[0])
    temp.file.push({ ...file, src: data.images[0].src })
    await baseController.BfindOneAndUpdate(siteSettingModel, { siteId: data.siteId }, { sliderImages: temp.sliderImages, file: temp.file });
    return res.json({ status: 200, data: "" });
}

exports.siteSettingAction = async (req, res, next) => {
    var data = req.body;
    var siteData = await baseController.BfindOne(siteSettingModel, { siteId: data.siteId });
    if (siteData) {
        await baseController.BfindOneAndUpdate(siteSettingModel, { siteId: data.siteId }, { leagueSort: data.leagueSort, news: data.news });
    } else {
        await baseController.data_save(data, siteSettingModel);
    }
    return res.json({ status: 200, data: "success" })
}

exports.getSiteSettingAction = async (req, res, next) => {
    var data = req.body;
    var siteData = await baseController.BfindOne(siteSettingModel, { siteId: data.siteId });
    return res.json({ status: 200, data: siteData })
}

exports.createAgentAction = async (req, res, next) => {
    var data = req.body;
    data.userId = data.userId.toLowerCase()
    data.password = data.password.toLowerCase()
    var isCheck = await baseController.BfindOne(userModel, { userId: data.userId });
    if (isCheck) {
        res.json({ status: 300, data: "Exsit Agent" });
        return false;
    }
    var agentData = await baseController.data_save(data, userModel);
    if (!agentData) {
        res.json({ status: 300, data: "Invalid Agent" });
        return false;
    }
    res.json({ status: 200, data: agentData });
    return true;
}

exports.createPlayerAction = async (req, res, next) => {
    var data = req.body;
    data.balance = parseInt(data.balance)
    data.userId = data.userId.toLowerCase()
    data.password = data.password.toLowerCase()
    var isCheck = await baseController.BfindOne(userModel, { userId: data.userId });
    if (isCheck) {
        res.json({ status: 300, data: "Exsit User" });
        return false;
    }
    var userData = await baseController.data_save(data, userModel);
    if (!userData) {
        res.json({ status: 300, data: "Invalid Info" });
        return false;
    }
    if (data.balance > 0) {
        var agentData = await baseController.BfindOneAndUpdate(userModel, { _id: data.agentId }, { $inc: { 'balance': (Math.abs(parseInt(data.balance)) * -1) } });
        if (!agentData) {
            res.json({ status: 300, data: "Failed Updating Agent Balance" });
            return false;
        }
        var isCheck = await baseController.data_save({
            userId: userData._id,
            currency: userData.currency,
            amount: userData.balance,
            role: userData.role,
            agentId: userData.agentId
        }, paymentHistoryModel);
        if (!isCheck) {
            res.json({ status: 300, data: "Wrong something from payment history" });
            return false;
        }
        res.json({ status: 200, userData: agentData });
        return true;
    }
    var agentData = await baseController.BfindOne(userModel, { _id: data.agentId });
    if (!agentData) {
        res.json({ status: 300, data: "Invalid Agent" });
        return false;
    }
    res.json({ status: 200, userData: agentData });
    return true;
}

exports.loginAction = async (req, res, next) => {
    var data = req.body;
    data.userId = data.userId.toLowerCase()
    data.password = data.password.toLowerCase()
    var userData = await baseController.BfindOne(userModel, { userId: data.userId, password: data.password });
    if (!userData) {
        res.json({ status: 300, data: "Invalid User" });
        return false;
    }
    var sessionData = {
        id: userData._id,
        userId: userData.userId,
        username: userData.username,
        timestamp: new Date().valueOf(),
    }
    var token = await authMiddlware.generateToken(sessionData);
    sessionData.token = token;
    await baseController.BfindOneAndUpdate(sessionModel, { id: userData._id }, sessionData);
    var ip = baseController.get_ipaddress(req);
    await baseController.data_save({
        userId: userData._id,
        created: data.created,
        ip: ip
    }, loginHistoryModel);
    res.json({ status: 200, userData: userData, token: token });
    return true;
}

exports.changePasswordAction = async (req, res, next) => {
    var data = req.body;
    var userData = await baseController.BfindOne(userModel, { userId: data.userId, password: data.password, _id: data.user_id });
    if (userData) {
        var result = await baseController.BfindOneAndUpdate(userModel, { _id: data.user_id }, { password: data.newPassword });
        res.json({ status: 200, data: result });
        return true;
    } else {
        res.json({ status: 300, data: "Invalid Password" });
        return false;
    }
}