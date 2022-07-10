const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const siteSettingModel = () => {
    var modelSchema = new Schema({
        siteId: { type: String },
        leagueSort: { type: Object, default: { value: 'RegionName', label: 'A~Z' } },
        news: { type: String },
        sliderImages: { type: Object },
        file: { type: Object },
        created: { type: Date, default: Date.now },
        updated: { type: Date }
    });
    return mongoose.model("tbl_site_setting", modelSchema)
}

module.exports = {
    siteSettingModel: siteSettingModel()
};