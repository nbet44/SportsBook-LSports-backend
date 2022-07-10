const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const betHistoryModel = () => {
    var modelSchema = new Schema({
        userId: { type: String },
        token: { type: String },
        amount: { type: Number },
        winnings: { type: Number },
        max_payout: { type: Number },
        ext_txn_ref: { type: String },
        debit_txn_ref: { type: String },
        credit_txn_ref: { type: String },
        cancel_txn_ref: { type: String },
        ext_bet_ref: { type: String },
        timestamp: { type: String },
        event_timestamp: { type: String },
        ext_event_ref: { type: String },
        cancel_reason: { type: String },
        created: { type: Date, default: Date.now },
        updated: { type: Date }
    });
    return mongoose.model("tbl_mohio_history", modelSchema)
}

const xpressHistoryModel = () => {
    var modelSchema = new Schema({
        action: { type: String },
        userId: { type: String },
        sessionId: { type: String },
        gameId: { type: String },
        playerId: { type: String },
        group: { type: String },
        currency: { type: String },
        gameCycle: { type: String },
        gameCycleClosed: { type: Boolean },
        transactionId: { type: String },
        transactionAmount: { type: Number },
        transactionCategory: { type: String },
        transactionType: { type: String },
        requestId: { type: String },
        siteId: { type: String },
        fingerprint: { type: String },
        timestamp: { type: String },
        winnings: { type: Number },
        type: { type: String },
        created: { type: Date, default: Date.now },
        updated: { type: Date }
    });
    return mongoose.model("tbl_xpress_history", modelSchema)
}

module.exports = {
    betHistoryModel: betHistoryModel(),
    xpressHistoryModel: xpressHistoryModel()
};