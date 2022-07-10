const TokenGenerator = require('uuid-token-generator');
const baseController = require("./baseController");
const { userModel } = require("../models/userModel");
const { betHistoryModel } = require("../models/betHistoryModel");
const tokgen = new TokenGenerator();

exports.casinoHistoryAction = async (req, res, next) => {
    var result = []
    var data = req.body;
    var userList = await baseController.Bfind(userModel, { agentId: data.agentId });
    var userIdArray = [];
    for (var i in userList) {
        userIdArray.push(userList[i]._id)
    }
    var history = await baseController.BfindSort(betHistoryModel, { userId: { $in: userIdArray } }, { created: -1 })
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

exports.getAccountAction = async (req, res, next) => {
    var data = req.body;
    if (!data) {
        res.json({ status: 400, data: "Bad request" })
    }
    var userData = await baseController.BfindOne(userModel, { token: data.token });
    if (!userData) {
        res.json({ status: 401, data: "Unauthorized User" });
        return false;
    }
    var accessToken = tokgen.generate();
    var updatedUser = await baseController.BfindOneAndUpdate(userModel, { _id: userData._id }, { access_token: accessToken });
    var result = {
        token: accessToken,
        player_id: updatedUser._id,
        player_name: updatedUser.username,
        balance: updatedUser.balance,
        currency: "TRY"
    }
    res.json({ status: 200, data: result });
    return true;
}

exports.getBalanceAction = async (req, res, next) => {
    var data = req.body;
    if (!data) {
        res.json({ status: 400, data: "Bad request" })
    }
    var userData = await baseController.BfindOne(userModel, { access_token: data.token });
    if (!userData) {
        res.json({ status: 401, data: "Unauthorized User" });
        return false;
    }
    var result = {
        balance: userData.balance,
        currency: "TRY"
    }
    res.json({ status: 200, data: result });
    return true;
}

exports.debitAction = async (req, res, next) => {
    var data = req.body;
    data.amount = parseInt(data.amount)
    console.log(data);
    if (!data) {
        res.json({ status: 400, data: "Bad request" })
    }
    var userData = await baseController.BfindOne(userModel, { access_token: data.token });
    if (!userData) {
        res.json({ status: 401, data: "Unauthorized User" });
        return false;
    }
    if (userData.balance < parseInt(data.amount)) {
        res.json({ status: 300, data: "Invalid User Balance" });
        return false;
    }
    var history = await baseController.BfindOne(betHistoryModel, { ext_bet_ref: data.ext_bet_ref });
    if (history) {
        res.json({ status: 406, data: "Not Acceptable Same Transaction" });
        return false;
    }
    data.userId = userData._id
    var saveData = await baseController.data_save(data, betHistoryModel);
    if (saveData) {
        var updateUser = await baseController.BfindOneAndUpdate(userModel, { _id: userData._id }, { $inc: { 'balance': (Math.abs(saveData.amount) * -1) } });
        var updateParent = await baseController.BfindOneAndUpdate(userModel, { _id: userData.agentId }, { $inc: { 'balance': (Math.abs(saveData.amount) * 1) } });
        var result = {
            timestamp: Date.now(),
            balance: updateUser.balance,
            currency: "TRY"
        }
        res.json({ status: 200, data: result })
        return true;
    }
    res.json({ status: 500, data: "Interal Sever Error" })
    return false;
}

exports.creditAction = async (req, res, next) => {
    var data = req.body;
    data.amount = parseInt(data.amount)
    console.log(data)
    if (!data) {
        res.json({ status: 400, data: "Bad request" })
    }
    var userData = await baseController.BfindOne(userModel, { access_token: data.token });
    if (!userData) {
        res.json({ status: 401, data: "Unauthorized User" });
        return false;
    }
    var history = await baseController.BfindOne(betHistoryModel, { ext_bet_ref: data.ext_bet_ref });
    if (!history) {
        res.json({ status: 406, data: "Not Acceptable No Bet" });
        return false;
    }
    // history = await baseController.BfindOne(betHistoryModel, { credit_txn_ref: data.ext_txn_ref });
    // if (history) {
    //     res.json({ status: 406, data: "Not Acceptable Same Transaction" });
    //     return false;
    // }
    data.userId = userData._id
    // var saveData = await baseController.data_save(data, betHistoryModel);
    var saveData = await baseController.BfindOneAndUpdate(betHistoryModel, { ext_bet_ref: data.ext_bet_ref }, { winnings: data.winnings });
    if (saveData) {
        var updateUser = await baseController.BfindOneAndUpdate(userModel, { _id: userData._id }, { $inc: { 'balance': (Math.abs(saveData.winnings)) } });
        var updateParent = await baseController.BfindOneAndUpdate(userModel, { _id: userData.agentId }, { $inc: { 'balance': (Math.abs(saveData.winnings) * -1) } });
        var result = {
            timestamp: Date.now(),
            balance: updateUser.balance,
            currency: "TRY"
        }
        res.json({ status: 200, data: result })
        return true;
    }
    res.json({ status: 500, data: "Interal Sever Error" })
    return false;
}

exports.cancelAction = async (req, res, next) => {
    var data = req.body;
    data.amount = parseInt(data.amount)
    console.log(data)
    if (!data) {
        res.json({ status: 400, data: "Bad request" })
    }
    var userData = await baseController.BfindOne(userModel, { access_token: data.token });
    if (!userData) {
        res.json({ status: 401, data: "Unauthorized User" });
        return false;
    }
    var history = await baseController.BfindOne(betHistoryModel, { ext_bet_ref: data.ext_bet_ref });
    if (!history) {
        res.json({ status: 406, data: "Not Acceptable No Bet" });
        return false;
    }
    // history = await baseController.BfindOne(betHistoryModel, { cancel_txn_ref: data.ext_txn_ref });
    // if (history) {
    //     res.json({ status: 406, data: "Not Acceptable Same Transaction" });
    //     return false;
    // }
    data.userId = userData._id
    // var saveData = await baseController.data_save(data, betHistoryModel);
    var saveData = await baseController.BfindOneAndUpdate(betHistoryModel, { ext_bet_ref: data.ext_bet_ref }, { cancel_reason: data.cancel_reason });
    if (saveData) {
        var updateUser = await baseController.BfindOneAndUpdate(userModel, { _id: userData._id }, { $inc: { 'balance': (Math.abs(history.amount)) * 1 } });
        var updateParent = await baseController.BfindOneAndUpdate(userModel, { _id: userData.agentId }, { $inc: { 'balance': (Math.abs(history.amount) * -1) } });
        var result = {
            timestamp: Date.now(),
            balance: updateUser.balance,
            currency: "TRY"
        }
        res.json({ status: 200, data: result })
        return true;
    }
    res.json({ status: 500, data: "Interal Sever Error" })
    return false;
}