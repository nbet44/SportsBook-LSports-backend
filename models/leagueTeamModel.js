const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leagueTeamModel = () => {
    var modelSchema = new Schema({
        name: { type: String },
        nameType: { type: String },
        country: { type: String },
        created: { type: Date, default: Date.now },
        updated: { type: Date }
    });
    return mongoose.model("tbl_league_team", modelSchema)
}

module.exports = {
    leagueTeamModel: leagueTeamModel()
};