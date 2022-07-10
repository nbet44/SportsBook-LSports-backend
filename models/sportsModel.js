const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sportsModel = () => {
    var modelSchema = new Schema({
        SportId: { type: Number },
        SportName: { type: String },
    });
    return mongoose.model("tbl_sports", modelSchema)
}

const locationModel = () => {
    var modelSchema = new Schema({
        LocationId: { type: Number },
        LocationName: { type: String },
    });
    return mongoose.model("tbl_location", modelSchema)
}

const prematchModel = () => {
    var modelSchema = new Schema({
        Id: { type: String, required: true },
        SportId: { type: Number },
        SportName: { type: String },
        RegionId: { type: Number },
        RegionName: { type: String },
        LeagueId: { type: Number },
        LeagueName: { type: String },
        HomeTeamId: { type: Number },
        HomeTeam: { type: String },
        AwayTeamId: { type: Number },
        AwayTeam: { type: String },
        IsPreMatch: { type: Boolean },
        Markets: { type: Object },
        Date: { type: Date },
        updated_at: { type: Date },
        clickCount: { type: Number, default: 1 }
    });
    return mongoose.model("tbl_prematch", modelSchema)
}

const inPlayModel = () => {
    var modelSchema = new Schema({
        Id: { type: String, required: true },
        Status: { type: Number },
        SportId: { type: Number },
        SportName: { type: String },
        RegionId: { type: Number },
        RegionName: { type: String },
        LeagueId: { type: Number },
        LeagueName: { type: String },
        HomeTeam: { type: String },
        AwayTeam: { type: String },
        BetRadarId: { type: Number },
        IsPreMatch: { type: Boolean },
        Date: { type: Date },
        Scoreboard: { type: Object },
        Markets: { type: Object },
        type: { type: String },
        clickCount: { type: Number, default: 1 },
        playCount: { type: Number, default: 1 },
        updated_at: { type: String }
    });
    return mongoose.model("tbl_inplay", modelSchema)
}

const historyModel = () => {
    var modelSchema = new Schema({
        userId: { type: String },
        name: { type: String },
        agentId: { type: String },
        amount: { type: Number },
        winAmount: { type: Number },
        leagueId: { type: String },
        matchId: { type: String },
        marketId: { type: String },
        oddsId: { type: String },
        desc: { type: String },
        sport: { type: String },
        odds: { type: String },
        betId: { type: String },
        type: { type: String },
        status: { type: String, default: "pending" },
        result: { type: String },
        created: { type: Date, default: Date.now }
    });
    return mongoose.model("tbl_history", modelSchema)
}

module.exports = {
    sportsModel: sportsModel(),
    locationModel: locationModel(),
    prematchModel: prematchModel(),
    inPlayModel: inPlayModel(),
    historyModel: historyModel(),
};