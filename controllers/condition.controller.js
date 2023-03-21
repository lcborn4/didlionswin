const axios = require("axios");

module.exports = {
  async checkScore() {
    console.log("checking score");

    let result = await axios.get(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule"
    );

    let scoreboard = await axios.get(
      " https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437952"
    );

    let gameScore = await axios.get(
      "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437952/competitions/401437952/competitors/8/score?lang=en&region=us"
    );

    console.log("result.data", result.data);
    console.log("result.data.events length", result.data.events.length);
    console.log("result.data.events", result.data.events);
    console.log("result.data.events[16]", result.data.events[16]);
    console.log(
      "result.data.events[16].competitions",
      result.data.events[16].competitions
    );

    console.log(
      "scoreboard.data",
      scoreboard.data.competitions[0].competitors[0]
    );
    console.log(
      "scoreboard.data",
      scoreboard.data.competitions[0].competitors[1]
    );

    console.log("gameScore", gameScore);

    let score = 0;
    return score;
  },
};
