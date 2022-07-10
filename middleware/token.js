const jsonwebtoken = require('jsonwebtoken');
const baseController = require("../controller/baseController");
const { userModel } = require("../models/userModel");
const { sessionModel } = require("../models/sessionModel");
const expireTime = 1000 * 60 * 60;

exports.check_token = async (req, res, next) => {
    var token = req.headers.token;
    if (!token || token == "undefined") {
        next();
    } else {
        try {
            var sessionData = await baseController.BfindOne(sessionModel, { token: token });
            var thisTime = new Date().valueOf();
            if (sessionData) {
                if ((sessionData.timestamp * 1) + expireTime < thisTime) {
                    return res.json({ status: 202, message: "session expired"});
                } else {
                    await baseController.BfindOneAndUpdate(sessionModel, { token }, { timestamp: thisTime });
                    // var user = await baseController.BfindOne(adminUser, { _id: sessionData.id });
                    // req.user = user;
                    next();
                }
            } else {
                return res.json({ status: 202, message: "session expired"});
            }
        } catch (e) {
            next();
        }
    }
}

exports.generateToken = async function (data) {
    try {
        var token = jsonwebtoken.sign(data, await new Date().valueOf().toString(), { expiresIn: `${expireTime}s` });
        return token;
    } catch (e) {
        return false;
    }
}