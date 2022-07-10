const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionModel = () => {
    var modelSchema = new Schema({
        id: {type : String},
        socket_id: {type : String},
        username : { type : String},
        username : { type : String},
        token: {type : String},
        timestamp: {type : Number}
    });
    return mongoose.model("tbl_session", modelSchema)
}

module.exports = {
    sessionModel: sessionModel()
};