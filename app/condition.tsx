import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";

//lions team id = 8
const LIONSID = "8";

interface Game {
    name: string
    date: string
    result: boolean
}

// async function testFunction() {
//     console.log('testing function')

//     console.log("checking result");

//     let game: any = {};
//     let result = false; //initial to loser

//     let schedule = await fetch(
//         "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule",{ cache: 'no-store' }
//     );

//     let scoreboardUrl =
//         "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";

//     // let gameScore = await fetch(
//     //   "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437952/competitions/401437952/competitors/8/score?lang=en&region=us",{ cache: 'no-store' }
//     // );

//     // console.log("result.data", result.data);
//     // console.log("result.data.events length", result.data.events.length);
//     console.log("schedule.data.events", schedule.data.events);
//     let scheduleLength = schedule.data.events.length;
//     //full event
//     console.log(
//         "schedule.data.events[scheduleLength]",
//         schedule.data.events[scheduleLength - 1]
//     );

//     console.log(
//         "schedule.data.events[scheduleLength].name",
//         schedule.data.events[scheduleLength - 1].name
//     );

//     game.name = schedule.data.events[scheduleLength - 1].name;
//     game.date = schedule.data.events[scheduleLength - 1].date;

//     let latestGameId = schedule.data.events[scheduleLength - 1].id;

//     let latestGame = await fetch(scoreboardUrl + "/" + latestGameId,{ cache: 'no-store' });
//     // console.log("latestGame", latestGame);
//     let competitors = latestGame.data.competitions[0].competitors;
//     //find the team and result
//     competitors.forEach((competitor: any) => {
//         // console.log("competitor", competitor);

//         if (competitor.id === LIONSID) {
//             result = competitor.winner;
//         }
//     });

//     //update game object
//     game.result = result;
//     console.log('returning game: ', game);
//     return game;

//     // console.log('returning game: ', game);

// }

// const GetCondition = async () => {
//     const game = await testFunction();

//     return (
//         <div>
//             <p>{game.name}</p>
//             <p>{game.date}</p>
//             <p>{game.result}</p>
//         </div>
//     )
//     // <p>{condition}</p>);
// };

export const Condition = (game: Game) => (
    // <div className={styles.pitch}>
    <div>
        <div>
            <p>{game.result ? 'Yes' : 'Nope'}</p>
        </div>
    </div>
);