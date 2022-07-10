const TokenGenerator = require('uuid-token-generator');
const baseController = require("./baseController");
const { userModel } = require("../models/userModel");
const { token, XG_siteId, XG_publicKey, XG_privateKey } = require("../config/index");
const { betHistoryModel, xpressHistoryModel } = require("../models/betHistoryModel");
const tokgen = new TokenGenerator();
const md5 = require('md5');

exports.casinoHistoryAction = async (req, res, next) => {
    var result = []
    var data = req.body;
    var userList = await baseController.Bfind(userModel, { agentId: data.agentId });
    var userIdArray = [];
    for (var i in userList) {
        userIdArray.push(userList[i]._id)
    }
    var history = await baseController.BfindSort(xpressHistoryModel, { userId: { $in: userIdArray } }, { created: -1 })
    for (var j in history) {
        var userData = await baseController.BfindOne(userModel, { _id: history[j].userId })
        result.push({
            userId: history[j].userId,
            username: userData.username,
            ...history[j]._doc
        })
    }
    res.json({ status: 200, data: result })
}

exports.getTokenAction = async (req, res, next) => {
    var data = req.body;
    // var token = uid();
    var token = tokgen.generate();
    var userData = await baseController.BfindOneAndUpdate(userModel, { _id: data.userId }, { token: token });
    res.json({ status: 200, data: token })
}

exports.logoutAction = async (req, res, next) => {
    var data = req.body;
    if (!data) {
        res.json({ status: false, code: 104, message: "Unknown request" })
        return false;
    }
    var userData = await baseController.BfindOne(userModel, { sessionId: data.sessionId });
    if (!userData) {
        res.json({ status: false, code: 106, message: "Invalid secure token" })
        return false;
    }
    var result = {
        playerId: "master" + userData._id,
        balance: userData.balance,
        currency: userData.currency,
        sessionId: data.sessionId,
        group: "master",
        timestamp: new Date().toISOString(),
        requestId: data.requestId,
    }
    result.fingerprint = md5("" + result.playerId + result.currency + result.balance + result.sessionId + result.group + result.timestamp + result.requestId + XG_privateKey)
    res.json({ status: true, code: 200, message: "Success", data: result });
    return true;
}

exports.loginAction = async (req, res, next) => {
    var data = req.body;
    if (!data) {
        res.json({ status: false, code: 104, message: "Unknown request" })
        return false;
    }
    var userData = await baseController.BfindOne(userModel, { token: data.token });
    if (!userData) {
        res.json({ status: false, code: 106, message: "Invalid secure token" })
        return false;
    }
    var sessionId = tokgen.generate();
    var updatedUser = await baseController.BfindOneAndUpdate(userModel, { _id: userData._id }, { sessionId: sessionId });
    var result = {
        playerId: "master" + updatedUser._id,
        playerNickname: updatedUser.username,
        balance: parseFloat(updatedUser.balance).toFixed(2),
        currency: updatedUser.currency,
        sessionId: sessionId,
        group: "master",
        timestamp: new Date().toISOString(),
        requestId: data.requestId,
    }
    result.fingerprint = md5("" + result.playerId + result.currency + result.playerNickname + result.balance + result.sessionId + result.group + result.timestamp + result.requestId + XG_privateKey)
    res.json({ status: true, code: 200, message: "Success", data: result });
    return true;
}

exports.getBalanceAction = async (req, res, next) => {
    var data = req.body;
    if (!data) {
        res.json({ status: false, code: 104, message: "Unknown request" })
        return false;
    }
    var userData = await baseController.BfindOne(userModel, { sessionId: data.sessionId });
    if (!userData) {
        res.json({ status: false, code: 106, message: "Invalid secure token" })
        return false;
    }
    var result = {
        playerId: "master" + userData._id,
        balance: parseFloat(userData.balance).toFixed(2),
        currency: userData.currency,
        sessionId: data.sessionId,
        group: "master",
        timestamp: new Date().toISOString(),
        requestId: data.requestId
    }
    console.log("-----------getbalance------------")
    console.log(result)
    console.log("-----------getbalance------------")
    result.fingerprint = md5("" + result.playerId + result.currency + result.balance + result.sessionId + result.group + result.timestamp + result.requestId + XG_privateKey)
    res.json({ status: true, code: 200, message: "Success", data: result });
    return true;
}

exports.debitAction = async (req, res, next) => {
    var data = req.body;
    console.log(data);
    if (!data) {
        res.json({ status: false, code: 104, message: "Unknown request" })
        return false;
    }
    var userData = await baseController.BfindOne(userModel, { sessionId: data.sessionId });
    if (!userData) {
        res.json({ status: false, code: 106, message: "Invalid secure token" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "BET", transactionId: data.transactionId });
    if (history) {
        res.json({ status: false, code: 116, message: "Transaction already exists" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "BET", gameCycle: data.gameCycle });
    if (history) {
        res.json({ status: false, code: 115, message: "Game cycle exists" })
        return false;
    }
    if (parseFloat(data.transactionAmount) > userData.balance || data.transactionAmount == 0) {
        res.json({ status: false, code: 107, message: "Insufficient funds" })
        return false;
    }
    data.userId = userData._id
    data.type = "BET"
    var saveData = await baseController.data_save(data, xpressHistoryModel);
    if (saveData) {
        var updateUser = await baseController.BfindOneAndUpdate(userModel, { _id: userData._id }, { $inc: { 'balance': (Math.abs(saveData.transactionAmount) * -1) } });
        var updateParent = await baseController.BfindOneAndUpdate(userModel, { _id: userData.agentId }, { $inc: { 'balance': (Math.abs(saveData.transactionAmount) * 1) } });
        var result = {
            playerId: data.playerId,
            currency: data.currency,
            balance: parseFloat(updateUser.balance).toFixed(2),
            oldBalance: parseFloat(userData.balance).toFixed(2),
            transactionId: data.transactionId,
            sessionId: data.sessionId,
            group: data.group,
            requestId: data.requestId,
            timestamp: new Date().toISOString()
        }
        console.log("-----------debit------------")
        console.log(result)
        console.log("-----------debit------------")
        result.fingerprint = md5("" + result.playerId + result.currency + result.balance + result.oldBalance + result.transactionId + result.sessionId + result.group + result.timestamp + result.requestId + XG_privateKey)
        res.json({ status: true, code: 200, message: "Success", data: result });
        return true;
    }
    res.json({ status: false, code: 500, message: "Interal Sever Error" })
    return false;
}

exports.creditAction = async (req, res, next) => {
    var data = req.body;
    console.log(data)
    if (!data) {
        res.json({ status: false, code: 104, message: "Unknown request" })
        return false;
    }
    var userData = await baseController.BfindOne(userModel, { sessionId: data.sessionId });
    if (!userData) {
        res.json({ status: false, code: 106, message: "Invalid secure token" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "BET", gameCycle: data.gameCycle });
    if (history.gameCycleClosed) {
        console.log("credit bet game cycle")
        res.json({ status: false, code: 118, message: "Game cycle already closed" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "WIN", gameCycle: data.gameCycle });
    if (history.gameCycleClosed) {
        console.log("credit win game cycle")
        res.json({ status: false, code: 118, message: "Game cycle already closed" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "WIN", transactionId: data.transactionId });
    if (history) {
        res.json({ status: false, code: 116, message: "Transaction already exists" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "BET", gameCycle: data.gameCycle });
    if (!history) {
        res.json({ status: false, code: 112, message: "Game cycle does not exist" })
        return false;
    }
    data.userId = userData._id
    data.type = "WIN"
    var saveData = await baseController.data_save(data, xpressHistoryModel);
    if (saveData) {
        var updateUser = await baseController.BfindOneAndUpdate(userModel, { _id: userData._id }, { $inc: { 'balance': (Math.abs(saveData.transactionAmount)) } });
        var updateParent = await baseController.BfindOneAndUpdate(userModel, { _id: userData.agentId }, { $inc: { 'balance': (Math.abs(saveData.transactionAmount) * -1) } });
        var result = {
            playerId: data.playerId,
            currency: data.currency,
            balance: parseFloat(updateUser.balance).toFixed(2),
            oldBalance: parseFloat(userData.balance).toFixed(2),
            transactionId: data.transactionId,
            sessionId: data.sessionId,
            group: data.group,
            requestId: data.requestId,
            timestamp: new Date().toISOString()
        }
        console.log("-----------creit------------")
        console.log(result)
        console.log("-----------creit------------")
        result.fingerprint = md5("" + result.playerId + result.currency + result.balance + result.oldBalance + result.transactionId + result.sessionId + result.group + result.timestamp + result.requestId + XG_privateKey)
        res.json({ status: true, code: 200, message: "Success", data: result });
        return true;
    }
    res.json({ status: false, code: 500, message: "Interal Sever Error" })
    return false;
}

exports.rollbackAction = async (req, res, next) => {
    var data = req.body;
    console.log(data)
    if (!data) {
        res.json({ status: false, code: 104, message: "Unknown request" })
        return false;
    }
    var userData = await baseController.BfindOne(userModel, { sessionId: data.sessionId });
    if (!userData) {
        res.json({ status: false, code: 106, message: "Invalid secure token" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "BET", gameCycle: data.gameCycle });
    if (history.gameCycleClosed) {
        console.log("rollback bet game cycle")
        res.json({ status: false, code: 118, message: "Game cycle already closed" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "WIN", gameCycle: data.gameCycle });
    if (history.gameCycleClosed) {
        console.log("rollback win game cycle")
        res.json({ status: false, code: 118, message: "Game cycle already closed" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "CANCELED_BET", gameCycle: data.gameCycle });
    if (history) {
        console.log("rollback canceled game cycle")
        res.json({ status: false, code: 118, message: "Game cycle already closed" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "BET", transactionId: data.transactionId });
    if (!history) {
        res.json({ status: false, code: 117, message: "Transaction does not exists" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "BET", gameCycle: data.gameCycle });
    if (!history) {
        res.json({ status: false, code: 112, message: "Game cycle does not exist" })
        return false;
    }
    var history = await baseController.BfindOne(xpressHistoryModel, { type: "CANCELED_BET", transactionId: data.transactionId });
    if (history) {
        res.json({ status: false, code: 116, message: "Transaction already exists" })
        return false;
    }
    data.userId = userData._id
    data.type = "CANCELED_BET"
    var saveData = await baseController.data_save(data, xpressHistoryModel);
    if (saveData) {
        var updateUser = await baseController.BfindOneAndUpdate(userModel, { _id: userData._id }, { $inc: { 'balance': (Math.abs(saveData.transactionAmount) * 1) } });
        var updateParent = await baseController.BfindOneAndUpdate(userModel, { _id: userData.agentId }, { $inc: { 'balance': (Math.abs(saveData.transactionAmount) * -1) } });
        var result = {
            playerId: data.playerId,
            currency: data.currency,
            balance: parseFloat(updateUser.balance).toFixed(2),
            oldBalance: parseFloat(userData.balance).toFixed(2),
            transactionId: data.transactionId,
            sessionId: data.sessionId,
            group: data.group,
            requestId: data.requestId,
            timestamp: new Date().toISOString()
        }
        console.log("-----------rollback------------")
        console.log(result)
        console.log("-----------rollback------------")
        result.fingerprint = md5("" + result.playerId + result.currency + result.balance + result.oldBalance + result.transactionId + result.sessionId + result.group + result.timestamp + result.requestId + XG_privateKey)
        res.json({ status: true, code: 200, message: "Success", data: result });
        return true;
    }
    res.json({ status: false, code: 500, message: "Interal Sever Error" })
    return false;
}