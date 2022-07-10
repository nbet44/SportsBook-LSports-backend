const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loginHistoryModel = () => {
    var modelSchema = new Schema({
        userId: { type: String},
        ip: {type: String},
        created: {type: Date, default: Date.now},
        updated: {type: Date}
    });
    return mongoose.model("tbl_login_history", modelSchema)
}

module.exports = {
    loginHistoryModel: loginHistoryModel()
};