const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentHistoryModel = () => {
    var modelSchema = new Schema({
        userId: { type: String },
        currency: { type: String, default: "TRY" },
        amount: { type: Number, default: 0 },
        status: { type: String },
        role: { type: String, default: "user" },
        pid: { type: String },
        agentId: { type: String },
        created: { type: Date, default: Date.now },
        updated: { type: Date }
    });
    return mongoose.model("tbl_payment_history", modelSchema)
}

module.exports = {
    paymentHistoryModel: paymentHistoryModel()
};