import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";

const axios = require("axios");
//lions team id = 8
const LIONSID = "8";

interface Game {
    name: string
    date: string
    result: boolean
}

async function getNextGame() {
    // console.log('testing function')

    // console.log("checking result");

    let game: any = {};
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
    // console.log("schedule.data.events", schedule.data.events);
    let scheduleLength = schedule.data.events.length;
    console.log('scheduleLength', scheduleLength)
    //full event
    // console.log(
    //     "schedule.data.events[scheduleLength]",
    //     schedule.data.events[scheduleLength - 1]
    // );

    // console.log(
    //     "schedule.data.events[scheduleLength].name",
    //     schedule.data.events[scheduleLength - 1].name
    // );

    game.name = schedule.data.events[scheduleLength - 1].name;
    game.date = schedule.data.events[scheduleLength - 1].date;

    let latestGameId = schedule.data.events[scheduleLength - 1].id;

    let latestGame = await axios.get(scoreboardUrl + "/" + latestGameId);
    // console.log("Next - latestGame.data", latestGame.data);
    let competitors = latestGame.data.competitions[0].competitors;
    let nextCompetition = null;
    // console.log('competitors', competitors);
    //find the team and result
    competitors.forEach((competitor: any) => {
        // console.log("competitor", competitor);

        if (competitor.id === LIONSID) {
            result = competitor.winner;
            nextCompetition = competitor.nextCompetition;
        }
    });

    if (nextCompetition) {
        let nextGameUrl = nextCompetition['$ref']
        // console.log('nextGameUrl', nextGameUrl)
        let nextGameResult = await axios(nextGameUrl);
        // console.log('nextGameResult.data', nextGameResult.data);
        let nextGameId = nextGameResult.data.id;
        // console.log('nextGameId', nextGameId)
        let nextGame = await axios.get(scoreboardUrl + "/" + nextGameId);
        // console.log('nextGame.Data', nextGame.data);
        game.name = nextGame.data.name;
        game.date = nextGame.data.date;
        let nextCompetitors = nextGameResult.data.competitors;
        //loop through until lions
        nextCompetitors.forEach((competitor: any) => {
            // console.log("competitor", competitor);

            if (competitor.id === LIONSID) {
                result = competitor.winner;
                // console.log('next result', result)
            }
        });
    }
    else {
        game.name = 'NO GAME'
    }
    //update game object
    game.result = result;
    // console.log('returning next game: ', game);

    // game.name = 'NO GAME'


    return game;

    // console.log('returning game: ', game);

}

// const GetNextCondition = async () => {
//     const next = await testFunction();

//     //obviously not going to have results
//     return (
//         <div>
//             <p>{next.name}</p>
//             <p>{next.date}</p>
//             <p>{next.result}</p>
//         </div>
//     )
//     // <p>{condition}</p>);
// };

// export const NextCondition = (game: Game) => (
//     <div className={styles.pitch}>
//         <div>
//             Game
//             <p>{game.name}</p>
//             <p>{game.date}</p>
//             <p>{game.result}</p>
//         </div>
//     </div>
// );

const GetNextCondition = async () => {
    const next = await getNextGame();

    if (next.name === 'NO GAME') {
        return (<div>
            Next Game
            <p>No Game</p>
        </div>
        )
    }

    return (
        <div>
            Next Game
            <p>{next.name}</p>
            <p>{next.date}</p>
            <p>{next.result ? 'WIN' : 'LOSS'}</p>
        </div>
    )
    // <p>{condition}</p>);
};

export const NextCondition = () => (
    <div className={styles.pitch}>
        <Suspense fallback={<RingLoader color="blue" loading />}>
            {/* @ts-expect-error Server Component */}
            <GetNextCondition />
        </Suspense>
    </div>
);