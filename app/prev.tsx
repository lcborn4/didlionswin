import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";

const axios = require("axios");
//lions team id = 8
const LIONSID = "8";
const SCHEDULEMAXLENGTH = 18;

interface Game {
    name: string
    date: string
    result: boolean
}

async function getPrevGame() {
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
    //full event
    // console.log(
    //     "schedule.data.events[scheduleLength-1]",
    //     schedule.data.events[scheduleLength - 1]
    // );

    // console.log(
    //     "schedule.data.events[scheduleLength].name",
    //     schedule.data.events[scheduleLength - 1].name
    // );

    // console.log(
    //     "schedule.data.events[scheduleLength-1].competitions",
    //     schedule.data.events[scheduleLength - 1].competitions
    // );

    // console.log(
    //     "schedule.data.events[scheduleLength-1].competitions[0]",
    //     schedule.data.events[scheduleLength - 1].competitions[0]
    // );

    // console.log(
    //     "Prev Game Status",
    //     schedule.data.events[scheduleLength - 1].competitions[0].status.type.completed
    // );

    // game.name = schedule.data.events[scheduleLength - 1].name;
    // game.date = schedule.data.events[scheduleLength - 1].date;

    let latestGameId = schedule.data.events[scheduleLength - 1].id;

    let latestGame = await axios.get(scoreboardUrl + "/" + latestGameId);
    // console.log("latestGame.data", latestGame.data);
    let competitors = latestGame.data.competitions[0].competitors;
    let previousCompetition = null;
    //find the team and result
    competitors.forEach((competitor: any) => {
        // console.log("competitor", competitor);

        if (competitor.id === LIONSID) {
            result = competitor.winner;
            previousCompetition = competitor.previousCompetition;
        }
    });

    // console.log('previousCompetition', previousCompetition)

    //get the previous competition
    if (previousCompetition) {
        let prevGameUrl = previousCompetition['$ref']
        // console.log('prevGameUrl', prevGameUrl)
        let previousGameResult = await axios(prevGameUrl);
        // console.log('previousGameResult.data', previousGameResult.data);
        let prevGameId = previousGameResult.data.id;
        // console.log('prevGameId', prevGameId)
        let prevGame = await axios.get(scoreboardUrl + "/" + prevGameId);
        // console.log('prevGame.Data', prevGame.data);
        game.name = prevGame.data.name;
        game.date = prevGame.data.date;
        let prevCompetitors = previousGameResult.data.competitors;
        //loop through until lions
        prevCompetitors.forEach((competitor: any) => {
            // console.log("competitor", competitor);

            if (competitor.id === LIONSID) {
                result = competitor.winner;
                // console.log('prev result', result)
            }
        });

    }
    else {
        game.name = 'NO GAME'
    }
    //update game object
    game.result = result;
    // console.log('returning prev game: ', game);
    //debug
    // game.name = 'NO GAME'




    return game;

    // console.log('returning game: ', game);

}


const GetPrevCondition = async () => {
    const prev = await getPrevGame();

    if (prev.name === 'NO GAME') {
        return (<div>
            Previous Game
            <p>No Game</p>
        </div>
        )
    }

    return (

        <div>
            Previous Game
            <p>{prev.name}</p>
            <p>{prev.date}</p>
            <p>{prev.result ? 'WIN' : 'LOSS'}</p>
        </div>
    )
    // <p>{condition}</p>);
};

export const PrevCondition = () => (
    <div className={styles.pitch}>
        <Suspense fallback={<RingLoader color="blue" loading />}>
            {/* @ts-expect-error Server Component */}
            <GetPrevCondition />
        </Suspense>
    </div>
);

// export const PrevCondition = (game: Game) => (
//     <div className={styles.pitch}>
//         <div>
//             Game
//             <p>{game.name}</p>
//             <p>{game.date}</p>
//             <p>{game.result}</p>
//         </div>
//     </div>
// );