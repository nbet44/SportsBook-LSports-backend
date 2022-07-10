const { default: axios } = require("axios");
const getUuid = require('uuid-by-string')
const {
    bwinPrematchModel,
    bwinInPlayModel,
    bwinEventModel,
    xpressGameModel,
    bwinHistoryModel
} = require("../models/bwinSportsModel");
const {
    prematchModel,
    inPlayModel,
} = require("../models/sportsModel");
const { paymentHistoryModel } = require('../models/paymentHistoryModel');
const { userModel } = require("../models/userModel");
const { leagueTeamModel } = require("../models/leagueTeamModel");
const baseController = require("../controller/baseController");
const { token, XG_siteId, XG_publicKey, UserName, Password, PreMatchID, InPlayID } = require("../config/index");
var FormData = require('form-data');
const fs = require('fs');
var prematchTeamNameData = "";
var liveTeamNameData = "";

module.exports = async (io) => {
    const getLiveDataMatch = async () => {
        request = {
            method: "get",
            url: "https://api.b365api.com/v1/bwin/inplay?token=" + token,
        };
        response = await axios(request);
        if (response.data.success === 1) {
            let data = response.data.results
            let sendEventIds = []
            let pages = Math.ceil(data.length / 10)
            for (let i = 0; i < pages; i++) {
                let tempEventIds = ""
                for (let j = i * 10; j < (i + 1) * 10; j++) {
                    if (data[j]) {
                        var saveData = data[j];
                        saveData.type = "inplay";
                        saveData.Id = saveData.Id.replace(":", "0");
                        await baseController.BfindOneAndDelete(bwinPrematchModel, { Id: saveData.Id });
                        var isCheck = await baseController.BfindOneAndUpdate(
                            bwinInPlayModel,
                            { Id: saveData.Id },
                            saveData
                        );
                        tempEventIds += saveData.Id
                        if (!isCheck) {
                            console.log("---" + saveData.Id + "---");
                        }
                        if (j + 1 != (i + 1) * 10) {
                            tempEventIds += ","
                        }
                    }
                }
                sendEventIds.push(tempEventIds)
            }
            let funcs = []
            for (let i in sendEventIds) {
                funcs.push(getRealtimeLiveMarket(sendEventIds[i]))
            }
            Promise.all(funcs)
        }
    }

    const getRealtimeLiveMarket = async (ids) => {
        let data = await getMarketsById(ids)
        for (let i in data) {
            if (data[i].Markets.length > 0) {
                // if (data[i].SportId === 4) {
                //   await writeLiveTeamNameData([data[i].LeagueName, data[i].RegionName, data[i].HomeTeam, data[i].AwayTeam])
                // }
                data[i].Id = data[i].Id.replace(":", "0");
                await baseController.BfindOneAndUpdate(bwinEventModel, { Id: data[i].Id }, data[i])
            } else if (data[i].optionMarkets.length > 0) {
                // if (data[i].SportId === 4) {
                //   await writeLiveTeamNameData([data[i].LeagueName, data[i].RegionName, data[i].HomeTeam, data[i].AwayTeam])
                // }
                data[i].Id = data[i].Id.replace(":", "0");
                let markets = []
                for (var j in data[i].optionMarkets) {
                    let convertData = {}
                    let optionMarkets = data[i].optionMarkets[j]
                    convertData.id = optionMarkets.id
                    convertData.name = optionMarkets.name
                    convertData.isMain = optionMarkets.isMain
                    convertData.visibility = optionMarkets.status
                    for (var k in optionMarkets.parameters) {
                        convertData[optionMarkets.parameters[k].key] = optionMarkets.parameters[k].value
                    }
                    // convertData.marketType = optionMarkets.grouping.parameters && optionMarkets.grouping.parameters.marketType ? optionMarkets.grouping.parameters.marketType : ""
                    convertData.attr = optionMarkets.grouping.parameters && optionMarkets.grouping.parameters.attr ? Math.abs(parseFloat(optionMarkets.grouping.parameters.attr)) : ""
                    convertData.results = []
                    for (var k in optionMarkets.options) {
                        convertData.results.push({
                            odds: optionMarkets.options[k].price.odds,
                            visibility: optionMarkets.options[k].status,
                            americanOdds: optionMarkets.options[k].price.americanOdds,
                            id: optionMarkets.options[k].id,
                            name: optionMarkets.options[k].name
                        })
                    }
                    markets.push(convertData)
                }
                data[i].Markets = markets
                await baseController.BfindOneAndUpdate(bwinEventModel, { Id: data[i].Id }, data[i])
            } else {
                data[i].Id = data[i].Id.replace(":", "0");
                await baseController.BfindOneAndDelete(bwinInPlayModel, { Id: data[i].Id })
            }
        }
        // putFileData("live_team_names.txt", liveTeamNameData);
    }

    const getMarketsById = async (ids) => {
        return new Promise(async function (resolve, reject) {
            const request = {
                method: "get",
                url: "https://api.b365api.com/v1/bwin/event?token=" + token + "&event_id=" + ids
            }
            axios(request).then(async function (response) {
                if (response.data && response.data.success) {
                    if (response.data.results && response.data.results.length) {
                        resolve(response.data.results)
                    } else {
                        resolve([])
                    }
                }
            })
                .catch(function (error) {
                    resolve([])
                });
        })
    }

    const getPreDataPage = async (param) => {
        let config = {
            method: 'get',
            url: "https://api.b365api.com/v1/bwin/prematch?token=" + token + param,
            headers: {},
            data: {
                page: 1,
                skip_markets: 1
            }
        };
        axios(config).then(async function (response) {
            let pager = response.data.pager
            let page = Math.round(pager.total / pager.per_page)
            let requests = []
            for (let i = 0; i < page; i++) {
                requests.push(getRealtimePreData(i + 1))
            }
            Promise.all(requests);
        })
            .catch(function (error) { });
    }

    const getPreMatch = async () => {
        console.log('get prematchs')
        let config = {
            method: 'post',
            url: "https://stm-snapshot.lsports.eu/PreMatch/GetEvents",
            headers: {},
            data: {
                "PackageId": PreMatchID,
                UserName,
                Password,
                "Sports": [6046],
                "FromDate": Date.now()
            }
        };
        let allcount = 0, maincount = 0;
        axios(config).then(async function (response) {
            if (response.data && response.data.Body) {
                let data = response.data.Body;
                for (let i in data) {
                    allcount++;
                    if (data[i].Markets !== null && data[i].Fixture.Status === 1) {
                        maincount++;
                        let saveData = {};
                        saveData.Id = data[i].FixtureId;
                        saveData.SportId = data[i].Fixture.Sport.Id;
                        saveData.SportName = data[i].Fixture.Sport.Name;
                        saveData.RegionId = data[i].Fixture.Location.Id;
                        saveData.RegionName = data[i].Fixture.Location.Name;
                        saveData.LeagueId = data[i].Fixture.League.Id;
                        saveData.LeagueName = data[i].Fixture.League.Name;
                        saveData.HomeTeamId = data[i].Fixture.Participants[0].Id;
                        saveData.HomeTeam = data[i].Fixture.Participants[0].Name;
                        saveData.AwayTeamId = data[i].Fixture.Participants[1].Id;
                        saveData.AwayTeam = data[i].Fixture.Participants[1].Name;
                        saveData.IsPreMatch = true;
                        saveData.Markets = data[i].Markets;
                        saveData.Date = data[i].Fixture.StartDate;
                        saveData.updated_at = data[i].Fixture.LastUpdate;
                        await baseController.BfindOneAndUpdate(
                            prematchModel,
                            { Id: saveData.Id },
                            saveData
                        )
                    }
                }
            }
            console.log('end prematchs ', allcount, maincount)
        }).catch(function (error) {
            console.log('prematch error ', error.message);
        });
    }

    const getInplay = async () => {
        console.log('get inplay')
        let toDay = new Date()
        let y = toDay.getFullYear(), m = toDay.getMonth() + 1, d = toDay.getDate()
        let from = new Date(y + '.' + m + '.' + d).valueOf(), to = new Date(y + '.' + m + '.' + d + ' 23:59').valueOf()

        let config = {
            method: 'post',
            url: "https://stm-snapshot.lsports.eu/InPlay/GetEvents",
            headers: {},
            data: {
                "PackageId": InPlayID,
                UserName,
                Password,
                "Sports": [6046, 265917, 48242, 54094, 35232, 154830],
                "FromDate": from,
                "ToDate": to
            }
        };
        let allcount = 0, maincount = 0;
        axios(config).then(async function (response) {
            if (response.data && response.data.Body) {
                let data = response.data.Body;
                for (let i in data) {
                    allcount++;
                    if (data[i].Markets !== null) {
                        if (data[i].Fixture.Status === 2) {
                            maincount++;
                            let saveData = {};
                            saveData.Id = data[i].FixtureId;
                            saveData.Status = data[i].Fixture.Status;
                            saveData.SportId = data[i].Fixture.Sport.Id;
                            saveData.SportName = data[i].Fixture.Sport.Name;
                            saveData.RegionId = data[i].Fixture.Location.Id;
                            saveData.RegionName = data[i].Fixture.Location.Name;
                            saveData.LeagueId = data[i].Fixture.League.Id;
                            saveData.LeagueName = data[i].Fixture.League.Name;
                            saveData.HomeTeamId = data[i].Fixture.Participants[0].Id;
                            saveData.HomeTeam = data[i].Fixture.Participants[0].Name;
                            saveData.AwayTeamId = data[i].Fixture.Participants[1].Id;
                            saveData.AwayTeam = data[i].Fixture.Participants[1].Name;
                            saveData.IsPreMatch = false;
                            saveData.Markets = data[i].Markets;
                            saveData.Scoreboard = data[i].Livescore;
                            saveData.Date = data[i].Fixture.StartDate;
                            saveData.updated_at = data[i].Fixture.LastUpdate;
                            await baseController.BfindOneAndUpdate(
                                inPlayModel,
                                { Id: saveData.Id },
                                saveData
                            )
                            await prematchModel.deleteMany({ Id: data[i].FixtureId })
                        }
                        else {
                            let bets = await bwinHistoryModel.aggregate([
                                {
                                    $match: { $and: [{ matchId: data[i].FixtureId }, { status: 'pending' }] }
                                },
                                {
                                    $group: {
                                        _id: "$marketId",
                                        count: {
                                            $sum: 1
                                        },
                                        data: {
                                            $push: {
                                                amount: "$amount",
                                                winAmount: "$winAmount",
                                                oddsId: "$oddsId",
                                                userId: "$userId",
                                                agentId: "$agentId",
                                                betId: "$betId",
                                                type: "$type",
                                                id: "$_id",
                                            }
                                        }
                                    }
                                }
                            ])
                            if (data[i].Fixture.Status === 3) {
                                let rMarkets = data[i].Markets
                                for (let a in rMarkets) {
                                    for (let b in bets) {
                                        if (rMarkets[a].Id === bets[b]._id) {
                                            let rBets = rMarkets[a].Bets
                                            let uBets = bets[b].data
                                            for (let c in rBets) {
                                                for (let d in uBets) {
                                                    if (rBets[c].Id === uBets[d].oddsId) {
                                                        let status = '', balance = 0

                                                        if (rBets[c].Settlement === -1) {
                                                            // case in bet Cancelled
                                                            status = 'Cancelled'
                                                            balance = Math.abs(Number(uBets[d].amount)) * 1
                                                        }
                                                        else if (rBets[c].Settlement === 1) {
                                                            // case in bet lose
                                                            status = 'lose'
                                                            balance = 0
                                                        }
                                                        else if (rBets[c].Settlement === 2) {
                                                            // case in bet win
                                                            status = 'win'
                                                            balance = Math.abs(Number(uBets[d].amount * uBets[d].odds)) * 1
                                                        }
                                                        else if (rBets[c].Settlement === 3) {
                                                            // case in Refund
                                                            status = 'Refund'
                                                            balance = Math.abs(Number(uBets[d].amount)) * 1
                                                        }
                                                        else if (rBets[c].Settlement === 4) {
                                                            // case in bet HalfLost
                                                            status = 'HalfLost'
                                                            balance = Math.abs(Number(uBets[d].amount / 2)) * 1
                                                        }
                                                        else if (rBets[c].Settlement === 5) {
                                                            // case in bet HalfWon
                                                            status = 'HalfWon'
                                                            balance = Math.abs(Number(uBets[d].amount * uBets[d].odds / 2)) * 1
                                                        }
                                                        await baseController.BfindOneAndUpdate(bwinHistoryModel, { _id: uBets[d].id }, { status })
                                                        if (uBets[d].type === 'single') {
                                                            await baseController.BfindOneAndUpdate(userModel, { _id: uBets[d].userId }, { $inc: { 'balance': balance } })
                                                            await baseController.BfindOneAndUpdate(userModel, { _id: uBets[d].agentId }, { $inc: { 'balance': (balance * -1) } })
                                                        } else {
                                                            let mixBets = await Bfind(bwinHistoryModel, { betId: uBets[d].betId })
                                                            let count = 0, totalOdd = 1
                                                            for (let m in mixBets) {
                                                                if (mixBets[m].status === 'win') {
                                                                    count = count + 1
                                                                    totalOdd *= Number(mixBets[m].odds)
                                                                }
                                                                else break
                                                            }
                                                            if (count === mixBets.length) {
                                                                const mixBalance = totalOdd * mixBets[m].amount
                                                                await baseController.BfindOneAndUpdate(userModel, { _id: uBets[d].userId }, { $inc: { 'balance': mixBalance } })
                                                                await baseController.BfindOneAndUpdate(userModel, { _id: uBets[d].agentId }, { $inc: { 'balance': (mixBalance * -1) } })
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if (data[i].Fixture.Status !== 1 || data[i].Fixture.Status !== 2 || data[i].Fixture.Status !== 3) {
                                let status = ''
                                if (data[i].Fixture.Status === 4) {
                                    // case in match Cancelled
                                    status = 'Cancelled'
                                }
                                else if (data[i].Fixture.Status === 5) {
                                    // case in match Postponed
                                    status = 'Postponed'
                                }
                                else if (data[i].Fixture.Status === 6) {
                                    // case in match Interrupted
                                    status = 'Interrupted'
                                }
                                else if (data[i].Fixture.Status === 7) {
                                    // case in match Abandoned
                                    status = 'Abandoned'
                                }
                                else if (data[i].Fixture.Status === 8) {
                                    // case in match Coverage lost
                                    status = 'Coverage lost'
                                }
                                else if (data[i].Fixture.Status === 9) {
                                    // case in match About to start
                                    status = 'About to start'
                                }
                                for (let b in bets) {
                                    let uBets = bets[b].data
                                    for (let d in uBets) {
                                        let balance = 0
                                        balance = Math.abs(Number(uBets[d].amount)) * 1
                                        await baseController.BfindOneAndUpdate(bwinHistoryModel, { _id: uBets[d].id }, { status })
                                        await baseController.BfindOneAndUpdate(userModel, { _id: uBets[d].userId }, { $inc: { 'balance': balance } })
                                        await baseController.BfindOneAndUpdate(userModel, { _id: uBets[d].agentId }, { $inc: { 'balance': (balance * -1) } })
                                    }
                                }
                            }
                        }
                    }
                }
                console.log('end inplay ', allcount, maincount)
            }
        }).catch(function (error) {
            console.log('inplay error ', error.message);
        });
    }

    const getRealtimePreData = async (page) => {
        let config = {
            method: 'get',
            url: "https://api.b365api.com/v1/bwin/prematch?token=" + token + "&sport_id=4",
            headers: {},
            data: {
                page
            }
        };
        axios(config).then(async function (response) {
            if (response.data && response.data.success) {
                let data = response.data.results
                for (let i in data) {
                    var saveData = data[i];
                    saveData.type = "prematch";
                    // saveData.Id = saveData.Id.replace(":", "0");
                    if (saveData.Markets && saveData.Markets.length > 0) {
                        // if (saveData.SportId === 4) {
                        //   await writePrematchTeamNameData([saveData.LeagueName, saveData.RegionName, saveData.HomeTeam, saveData.AwayTeam])
                        // }
                        var isCheck = await baseController.BfindOneAndUpdate(
                            bwinPrematchModel,
                            { Id: saveData.Id },
                            saveData
                        );
                        if (!isCheck) {
                            console.log("---" + saveData.Id + "---");
                        }
                    } else if (saveData.optionMarkets.length > 0) {
                        // if (saveData.SportId === 4) {
                        //   await writePrematchTeamNameData([saveData.LeagueName, saveData.RegionName, saveData.HomeTeam, saveData.AwayTeam])
                        // }
                        let markets = []
                        for (var j in saveData.optionMarkets) {
                            let convertData = {}
                            let optionMarkets = saveData.optionMarkets[j]
                            convertData.id = optionMarkets.id
                            convertData.name = optionMarkets.name
                            convertData.isMain = optionMarkets.isMain
                            convertData.visibility = optionMarkets.status
                            for (var k in optionMarkets.parameters) {
                                convertData[optionMarkets.parameters[k].key] = optionMarkets.parameters[k].value
                            }
                            // convertData.marketType = optionMarkets.grouping.parameters && optionMarkets.grouping.parameters.marketType ? optionMarkets.grouping.parameters.marketType : ""
                            convertData.attr = optionMarkets.grouping.parameters && optionMarkets.grouping.parameters.attr ? Math.abs(parseFloat(optionMarkets.grouping.parameters.attr)) : ""
                            convertData.results = []
                            for (var k in optionMarkets.options) {
                                convertData.results.push({
                                    odds: optionMarkets.options[k].price.odds,
                                    visibility: optionMarkets.options[k].status,
                                    americanOdds: optionMarkets.options[k].price.americanOdds,
                                    id: optionMarkets.options[k].id,
                                    name: optionMarkets.options[k].name
                                })
                            }
                            markets.push(convertData)
                        }
                        saveData.Markets = markets
                        await baseController.BfindOneAndUpdate(bwinPrematchModel, { Id: saveData.Id }, saveData)
                    }
                }
                // putFileData("prematch_team_names.txt", prematchTeamNameData);
            }
        })
            .catch(function (error) { });
    }

    const setScoreFinished = async () => {
        var data = await baseController.Bfind(bwinEventModel, { 'Scoreboard.period': 'Finished' })
        for (var i in data) {
            let config = {
                method: 'get',
                url: "https://api.b365api.com/v1/bwin/result?token=" + token + "&event_id=" + data[i].Id,
            };
            var response = await axios(config);
            if (response.data.results.length > 0 && response.data.success) {
                var result = response.data.results[0]
                var scores = result.scores && result.scores[Object.keys(result.scores)[Object.keys(result.scores).length - 1]] ? result.scores[Object.keys(result.scores)[Object.keys(result.scores).length - 1]] : "";
                if (data[i].SportId === 4 || data[i].SportId === 12 || data[i].SportId === 16) {
                    var index = scores && scores.home < scores.away ? 2 : 0;
                } else {
                    var index = scores && scores.home < scores.away ? 1 : 0;
                }
                var history = await baseController.Bfind(bwinHistoryModel, { matchId: data[i].Id, isMain: true, index: index })
                var isCheckHistory = await baseController.Bfind(bwinHistoryModel, { matchId: data[i].id })
                if (isCheckHistory.length > 0) {
                    await baseController.BfindOneAndUpdate(bwinHistoryModel, { matchId: data[i].id }, { result: scores[0] + "-" + scores[1], status: "lose" })
                }
                for (var i in history) {
                    var userData = await baseController.BfindOne(userModel, { _id: history[i].userId })
                    if (userData) {
                        await baseController.BfindOneAndUpdate(userModel, { _id: history[i].userId }, { $inc: { 'balance': (Math.abs(parseInt(history[i].amount * history[i].odds)) * 1) } })
                        await baseController.BfindOneAndUpdate(userModel, { _id: userData.agentId }, { $inc: { 'balance': (Math.abs(parseInt(history[i].amount * history[i].odds)) * -1) } })
                    }
                }
                var isCheckHistory = await baseController.Bfind(bwinHistoryModel, { matchId: data[i].id, isMain: true, index: index })
                if (isCheckHistory.length > 0) {
                    await baseController.BfindOneAndUpdate(bwinHistoryModel, { matchId: data[i].id, isMain: true, index: index }, { result: scores[0] + "-" + scores[1], status: "win" })
                }
                // var saveData = {
                //   ...data.selectedResult[j],
                //   result: data.result
                // }
                // await baseController.BfindOneAndUpdate(bwinResultModel, { matchId: data[i].id, isMain: true }, saveData)
            }
        }
    }

    const removeOldMatchs = async () => {
        const currentDate = new Date(new Date().valueOf() - (1000 * 300)).toJSON()
        await setScoreFinished()
        await prematchModel.deleteMany({ $or: [{ updatedAt: { $lte: currentDate } }] })
        // await bwinInPlayModel.deleteMany({ $or: [{ 'Scoreboard.period': 'Finished' }, { updatedAt: { $lte: currentDate } }] })
        // await bwinEventModel.deleteMany({ $or: [{ 'Scoreboard.period': 'Finished' }, { updatedAt: { $lte: currentDate } }] })
    }

    async function writePrematchTeamNameData(data) {
        var nameType = { 0: "league", 1: "country", 2: "team", 3: "team" }
        for (var i in data) {
            var isCheck = await baseController.BfindOne(leagueTeamModel, { name: data[i] })
            // var isCheck = await baseController.BfindOneAndUpdate(leagueTeamModel, { name: data[i] }, { name: data[i] })
            if (!isCheck) {
                var saveData = {
                    name: data[i],
                    nameType: nameType[i],
                    country: data[1],
                }
                await baseController.data_save(saveData, leagueTeamModel)
                prematchTeamNameData = prematchTeamNameData + "\n" + data[i];
            }
        }
    }

    async function writeLiveTeamNameData(data) {
        var nameType = { 0: "league", 1: "country", 2: "team", 3: "team" }
        for (var i in data) {
            var isCheck = await baseController.BfindOne(leagueTeamModel, { name: data[i] })
            // var isCheck = await baseController.BfindOneAndUpdate(leagueTeamModel, { name: data[i] }, { name: data[i] })
            if (!isCheck) {
                var saveData = {
                    name: data[i],
                    nameType: nameType[i],
                    country: data[1],
                }
                await baseController.data_save(saveData, leagueTeamModel)
                liveTeamNameData = liveTeamNameData + "\n" + data[i];
                console.log(saveData)
            }
        }
    }

    function putFileData(name, data) {
        fs.appendFile(name, data, 'utf8',
            function (err) {
                if (err) throw err;
                console.log("have done")
            });
        // fs.writeFile(name, data, function (err) {
        //   if (err) return console.log(err);
        //   console.log('have done team_names.txt');
        // });
    }

    const makeWeeklyCredit = async () => {
        var registeredHours = 3;
        var todayDay = new Date().getDay()
        var agentData = await baseController.Bfind(userModel, { role: "agent" });
        for (var i in agentData) {
            if (agentData[i].weeklyCreditResetState && agentData[i].weeklyCreditResetState.value === "true") {
                var autoWeeklyCredit = agentData[i].autoWeeklyCredit
                if (todayDay === parseInt(agentData[i].weeklyCreditResetDay.value)) {
                    console.log("--- match weekly credit day ---");
                    console.log(agentData[i].weeklyCreditResetDay.value)
                    if (registeredHours === new Date().getHours()) {
                        console.log("--- match weekly credit hour ---");
                        console.log(new Date().getHours())
                        var parentData = await baseController.BfindOne(userModel, { _id: agentData[i].pid });
                        if (parseInt(parentData.balance) < parseInt(autoWeeklyCredit)) {
                            console.log("--- parent balance isn't enough for auto weekly credit ---")
                            return false;
                        }
                        await baseController.BfindOneAndUpdate(userModel, { _id: agentData[i]._id }, { $inc: { 'balance': (Math.abs(parseInt(autoWeeklyCredit)) * 1) } });
                        await baseController.BfindOneAndUpdate(userModel, { _id: parentData._id }, { $inc: { 'balance': (Math.abs(parseInt(autoWeeklyCredit)) * -1) } });
                        saveData = {
                            userId: agentData[i]._id,
                            currency: agentData[i].currency,
                            role: agentData[i].role,
                            pid: parentData._id,
                            agentId: parentData._id,
                            amount: autoWeeklyCredit
                        }
                        await baseController.data_save(saveData, paymentHistoryModel);
                    } else {
                        await baseController.BfindOneAndUpdate(userModel, { _id: agentData[i]._id }, { weeklyCreditProceed: false });
                    }
                }
            }
        }
    }

    async function run() {
        // var data = await baseController.Bfind(leagueTeamModel);
        // for (var i in data) {
        //   prematchTeamNameData = prematchTeamNameData + "\n" + data[i].name;
        // }
        let config = {
            method: 'get',
            url: "https://api.b365api.com/v1/bwin/prematch?token=" + token + "&day=20211209&sport_id=4&skip_markets=1",
        };
        axios(config).then(async function (response) {
            if (response.data && response.data.success) {
                var data = response.data.results
                for (var i in data) {
                    await writePrematchTeamNameData([data[i].LeagueName, data[i].RegionName, data[i].HomeTeam, data[i].AwayTeam])
                }
            }
            putFileData("prematch_team_names.txt", prematchTeamNameData);
        })
        // var output = {};
        // var teamNames = await baseController.Bfind(leagueTeamModel);
        // for (var i in teamNames) {
        //   var id = getUuid(teamNames[i].name);
        //   output[id] = teamNames[i].name;
        // }
        // fs.writeFile("teamNames.json", JSON.stringify(output), function (err) {
        //   console.log(err);
        // });
    }

    // run()
    // setTimeout(async function () {
    //     var monthArray = { 0: "01", 1: "02", 2: "03", 3: "04", 4: "05", 5: "06", 6: "07", 7: "08", 8: "09", 9: "10", 10: "11", 11: "12" };
    //     var currentDate = new Date();

    //     await getPreDataPage("&day=" + (currentDate.getFullYear() + monthArray[currentDate.getMonth()] + (currentDate.getDate())))
    //     await getPreDataPage("&day=" + (currentDate.getFullYear() + monthArray[currentDate.getMonth()] + (currentDate.getDate() + 1)))
    //     await getPreDataPage("&day=" + (currentDate.getFullYear() + monthArray[currentDate.getMonth()] + (currentDate.getDate() + 2)))
    //     await getPreDataPage("&day=" + (currentDate.getFullYear() + monthArray[currentDate.getMonth()] + (currentDate.getDate() + 3)))
    //     await getPreDataPage("&day=" + (currentDate.getFullYear() + monthArray[currentDate.getMonth()] + (currentDate.getDate() + 4)))
    //     await getLiveDataMatch()
    //     // await makeWeeklyCredit()

    //     var userData = await baseController.BfindOne(userModel, { userId: "admin" });
    //     if (!userData) {
    //         var isCheck = await baseController.data_save({
    //             username: "admin",
    //             password: "12345678",
    //             userId: "admin",
    //             currency: "TRY",
    //             role: "admin",
    //             pid: "0",
    //             balance: 1000,
    //             permission: {
    //                 agent: true,
    //                 player: true
    //             }
    //         }, userModel);
    //     }

    //     var data = new FormData();
    //     data.append('siteId', XG_siteId);
    //     data.append('publicKey', XG_publicKey);

    //     var request = {
    //         method: 'post',
    //         url: 'https://winbet555stg-api.staging-hub.xpressgaming.net/api/v3/get-game-list',
    //         headers: {
    //             ...data.getHeaders()
    //         },
    //         data: data
    //     };

    //     var response = await axios(request);
    //     if (response.data.status === true) {
    //         var data = response.data.data;
    //         for (var i in data) {
    //             var saveData = data[i];
    //             var isCheck = await baseController.BfindOneAndUpdate(
    //                 xpressGameModel,
    //                 { gameId: saveData.gameId },
    //                 saveData
    //             );
    //             if (!isCheck) {
    //                 console.log("---" + saveData.Id + "---");
    //             }
    //         }
    //     }
    //     await removeOldMatchs()
    // }, 1000 * 5);

    // setInterval(async function () {
    //     await getRealtimePreData()
    //     await getLiveDataMatch()
    //     await removeOldMatchs()
    // }, 1000 * 30);


    // io.on("connection", async (socket) => {
    //   console.log("--- socket id ---");
    //   console.log(socket.id);
    //   console.log("--- socket id ---");
    //   await makeWeeklyCredit()
    // });

    setInterval(async function () {
        console.log("refresh");
        await getPreMatch()
        await getInplay()
    }, 1000 * 60);
    await getPreMatch()
    await getInplay()
};
