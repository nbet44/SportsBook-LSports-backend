const { default: axios } = require("axios");
const { uid } = require('uid');
const TokenGenerator = require('uuid-token-generator');
const baseController = require("./baseController");
const { userModel } = require("../models/userModel");
const { paymentHistoryModel } = require('../models/paymentHistoryModel');
const { bwinPrematchModel, bwinInPlayModel, bwinHistoryModel, bwinEventModel, bwinResultModel } = require("../models/bwinSportsModel");
const { loginHistoryModel } = require("../models/loginHistoryModel");
const tokgen = new TokenGenerator();

exports.getBalance = async (req, res, next) => {
    var data = req.body;
    var result = {
        credit: 0,
        balance: 0,
        risk: 0,
        openWeek: 0
    }
    var userData = await baseController.BfindOne(userModel, { _id: data.userId });
    if (!userData) {
        return res.json({ status: 300, data: "Invalid User" });
    }
    result.credit = userData.balance
    var date = {
        $gte: new Date(Date.now() - 3600 * 1000 * 24 * 7 * parseInt(data.week.value)),
    }
    var history = await bwinHistoryModel.find({ userId: data.userId, created: date })
    for (var i in history) {
        if (history[i].status === "pending") {
            result.risk = result.risk + parseInt(history[i].amount)
        } else if (history[i].status === "win") {
            result.balance = result.balance - parseInt(history[i].amount)
        } else {
            result.balance = result.balance - parseInt(history[i].amount)
        }
    }
    return res.json({ status: 200, data: result })
}

exports.getProfile = async (req, res, next) => {
    var data = req.body;
    var userData = await baseController.BfindOne(userModel, { _id: data._id });
    if (!userData) {
        res.json({ status: 300, data: "Invalid User" });
        return false;
    }
    res.json({ status: 200, data: userData });
}

exports.getTransaction = async (req, res, next) => {
    var data = req.body;
    var history = await baseController.Bfind(paymentHistoryModel, { userId: data.userId })
    res.json({ status: 200, data: history })
}

exports.getBetList = async (req, res, next) => {
    var data = req.body;
    var filter = {}
    var result = [];
    if (data.filter) {
        filter.created = {
            $gte: new Date(Date.now() - 3600 * 1000 * 24 * 7 * parseInt(data.filter.week)),
        }
        filter.userId = data.userId
        if (data.filter.status !== "" && data.filter.status !== "all") {
            filter.status = data.filter.status
        }
    }
    var history = await baseController.BfindSort(bwinHistoryModel, filter, { created: -1 })
    var multiResult = {}
    for (var i in history) {
        var row = history[i]
        if (multiResult[row["betId"]]) {
            multiResult[row["betId"]].push(row)
        } else {
            multiResult[row["betId"]] = [row]
        }
    }
    for (var i in multiResult) {
        if (multiResult[i].length > 1) {
            var row = multiResult[i][0]
            var totalOdds = 0
            for (var j in multiResult[i]) {
                totalOdds = totalOdds + parseInt(multiResult[i][j].odds)
            }
            result.push({
                sport: row.sport,
                created: row.created,
                desc: "Parlay " + multiResult[i].length,
                odds: totalOdds,
                winAmount: row.winAmount,
                amount: row.amount,
                result: row.result,
                status: row.status,
                betId: row.betId
            })
        } else {
            var row = multiResult[i][0]
            result.push({
                sport: row.sport,
                created: row.created,
                desc: row.desc,
                odds: row.odds,
                winAmount: row.winAmount,
                amount: row.amount,
                result: row.result,
                status: row.status,
                betId: row.betId
            })
            delete multiResult[i]
        }
    }
    res.json({ status: 200, data: { result, group: multiResult } })
    return true
}

exports.getLoginHistory = async (req, res, next) => {
    var data = req.body;
    var result = [];
    var history = await baseController.Bfind(loginHistoryModel, { userId: data.userId })
    for (var i in history) {
        var userData = await baseController.BfindOne(userModel, { _id: history[i].userId })
        result.push({
            ...history[i]._doc,
            username: userData.username
        })
    }
    res.json({ status: 200, data: result })
    return true
}