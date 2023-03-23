const axios = require("axios");

//lions team id = 8
const LIONSID = "8";

module.exports = {
  async checkResult() {
    console.log("checking result");

    let game = {};
    let result = false; //initial to loser

    let schedule = await axios.get(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule"
    );

    let scoreboardUrl =
      "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";

    // let gameScore = await axios.get(
    //   "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437952/competitions/401437952/competitors/8/score?lang=en&region=us"
    // );

    // console.log("result.data", result.data);
    // console.log("result.data.events length", result.data.events.length);
    console.log("schedule.data.events", schedule.data.events);
    let scheduleLength = schedule.data.events.length;
    //full event
    console.log(
      "schedule.data.events[scheduleLength]",
      schedule.data.events[scheduleLength - 1]
    );

    console.log(
      "schedule.data.events[scheduleLength].name",
      schedule.data.events[scheduleLength - 1].name
    );

    game.name = schedule.data.events[scheduleLength - 1].name;
    game.date = schedule.data.events[scheduleLength - 1].date;

    let latestGameId = schedule.data.events[scheduleLength - 1].id;

    let latestGame = await axios.get(scoreboardUrl + "/" + latestGameId);
    // console.log("latestGame", latestGame);
    let competitors = latestGame.data.competitions[0].competitors;
    //find the team and result
    competitors.forEach((competitor) => {
      // console.log("competitor", competitor);

      if (competitor.id === LIONSID) {
        result = competitor.winner;
      }
    });

    //update game object
    game.result = result;

    return game;
  },
};
