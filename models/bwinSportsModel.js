const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bwinPrematchModel = () => {
    var modelSchema = new Schema({
        Id: { type: String, required: true },
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
        IsOutright: { type: Boolean },
        Markets: { type: Object },
        Date: { type: Date },
        Scoreboard: { type: Object },
        type: { type: String },
        marketType: { type: String },
        clickCount: { type: Number, default: 1 },
        playCount: { type: Number, default: 1 },
        updated_at: { type: Number }
    });
    return mongoose.model("tbl_bwin_prematch", modelSchema)
}

const bwinInPlayModel = () => {
    var modelSchema = new Schema({
        Id: { type: String, required: true },
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
        type: { type: String },
        clickCount: { type: Number, default: 1 },
        playCount: { type: Number, default: 1 },
        updated_at: { type: Number }
    });
    return mongoose.model("tbl_bwin_inplay", modelSchema)
}

const bwinHistoryModel = () => {
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
    return mongoose.model("tbl_bwin_history", modelSchema)
}

const bwinResultModel = () => {
    var modelSchema = new Schema({
        leagueId: { type: String },
        matchId: { type: String },
        marketId: { type: String },
        oddsId: { type: String },
        isSuspend: { type: Boolean, default: false },
        isRemove: { type: Boolean, default: false },
        isWin: { type: Boolean, default: false },
        index: { type: Number, default: 0 },
        odds: { type: Number, default: 0 },
        result: { type: String },
        created: { type: Date, default: Date.now }
    });
    return mongoose.model("tbl_bwin_result", modelSchema)
}

const bwinFavoriteModel = () => {
    var modelSchema = new Schema({
        AwayTeam: { type: String },
        AwayTeamId: { type: String },
        AwayTeamShort: { type: String },
        BetRadarId: { type: String },
        HomeTeam: { type: String },
        HomeTeamId: { type: String },
        HomeTeamShort: { type: String },
        Id: { type: String },
        IsPreMatch: { type: Boolean },
        LeagueId: { type: String },
        LeagueName: { type: String },
        Markets: { type: Object },
        RegionId: { type: String },
        RegionName: { type: String },
        Scoreboard: { type: Object },
        SportId: { type: String },
        SportName: { type: String },
        optionMarkets: { type: Object },
        our_event_id: { type: String },
        updated_at: { type: String },
        Date: { type: Date },
        created: { type: Date, default: Date.now }
    });
    return mongoose.model("tbl_bwin_favorite", modelSchema)
}

const bwinEventModel = () => {
    var modelSchema = new Schema({
        AwayTeam: { type: String },
        AwayTeamId: { type: String },
        AwayTeamShort: { type: String },
        BetRadarId: { type: String },
        HomeTeam: { type: String },
        HomeTeamId: { type: String },
        HomeTeamShort: { type: String },
        Id: { type: String },
        IsPreMatch: { type: Boolean },
        LeagueId: { type: String },
        LeagueName: { type: String },
        Markets: { type: Object },
        RegionId: { type: String },
        RegionName: { type: String },
        Scoreboard: { type: Object },
        SportId: { type: String },
        SportName: { type: String },
        optionMarkets: { type: Object },
        our_event_id: { type: String },
        updated_at: { type: String },
        Date: { type: Date },
        favor: { type: Boolean },
        created: { type: Date, default: Date.now }
    });
    return mongoose.model("tbl_bwin_event", modelSchema)
}

const xpressGameModel = () => {
    var modelSchema = new Schema({
        gameId: { type: String },
        gameFriendlyName: { type: String },
        gameTitle: { type: String },
        provider: { type: String },
        thumbnail: { type: String },
        type: { type: String },
        sub_type: { type: String },
        platforms: { type: Object },
        jurisdictions: { type: Object },
        language: { type: Object },
        created: { type: Date, default: Date.now }
    });
    return mongoose.model("tbl_xpress_game", modelSchema)
}

module.exports = {
    bwinPrematchModel: bwinPrematchModel(),
    bwinInPlayModel: bwinInPlayModel(),
    bwinHistoryModel: bwinHistoryModel(),
    bwinResultModel: bwinResultModel(),
    bwinFavoriteModel: bwinFavoriteModel(),
    bwinEventModel: bwinEventModel(),
    xpressGameModel: xpressGameModel()
};