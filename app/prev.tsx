import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";
import { Inter } from "@next/font/google";

import moment from "moment-timezone";

 
//lions team id = 8
const LIONSID = "8";
const SCHEDULEMAXLENGTH = 18;


const inter = Inter({ subsets: ['latin'] })
interface Game {
    name: string
    date: string
    result: boolean
}

async function getPrevGame() {

    let game: any = {};
    let result = false; //initial to loser

    let schedule = await getSchedule();
    console.log('schedule',schedule)

    let scoreboardUrl =
        "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";

    // let gameScore = await fetch(
    //   "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437952/competitions/401437952/competitors/8/score?lang=en&region=us",{ cache: 'no-store' }
    // );

    // console.log("result.data", result.data);
    // console.log("result.data.events length", result.data.events.length);
    // console.log("schedule.data.events", schedule.data.events);
    let scheduleLength = schedule.events.length;
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

    //sget todays date
    let date = new Date();

    //find the latestGame
    let latestGameIndex = 16; //default to last game
    schedule.events.forEach((event: any ,index: number)=>{
        if(Date.parse(event.date) < date.getTime())
        {
            latestGameIndex = index;

        }
    })

    // let latestGameId = schedule.data.events[scheduleLength - 1].id;

    console.log('latestGame - ',latestGameIndex);

    // game.name = schedule.data.events[latestGameIndex].name;
    // game.date = schedule.data.events[latestGameIndex].date;


    game.name = schedule.events[latestGameIndex].name;
    game.date = schedule.events[latestGameIndex].date;

    //old
    // game.name = schedule.data.events[scheduleLength - 1].name;
    // game.date = schedule.data.events[scheduleLength - 1].date;

    let latestGameId = schedule.events[latestGameIndex].id;
    //old
    // let latestGameId = schedule.data.events[scheduleLength - 1].id;

    let latestGame = await getLatestGame(latestGameId);
    // console.log("latestGame.data", latestGame.data);
    let competitors = latestGame.competitions[0].competitors;
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
        let previousGameResult = await getPreviousGameResult(prevGameUrl);
        // console.log('previousGameResult.data', previousGameResult.data);
        let prevGameId = previousGameResult.id;
        // console.log('prevGameId', prevGameId)
        let prevGame = await getPreviousGame(prevGameId)
        // console.log('prevGame.Data', prevGame.data);
        game.name = prevGame.name;
        game.date = prevGame.date;
        let prevCompetitors = previousGameResult.competitors;
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
    // game.date = new Date(game.date).toString();

    let myTimezone = "America/New_York";
    let myDatetimeFormat= "YYYY-MM-DD hh:mm:ss a z";
    game.date = moment(new Date(game.date)).tz(myTimezone).format(myDatetimeFormat);

    return game;

    // console.log('returning game: ', game);

}


const GetPrevCondition = async () => {
    const prev = await getPrevGame();

    {/* <a
                            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                            className={styles.card}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <h2 className={inter.className}>
                                Docs <span>-&gt;</span>
                            </h2>
                            <p className={inter.className}>
                                Find in-depth information about Next.js features and&nbsp;API.
                            </p>
                        </a> */}

    if (prev.name === 'NO GAME') {
        return (<div>
            Previous Game
            <p>No Game</p>
            <h2 className={inter.className}>
                Docs <span>-&gt;</span>
            </h2>
        </div>
        )
    }

    return (

        <div>
            <h2>Previous Game</h2>
            <p>{prev.name}</p>
            <p>{prev.date}</p>
            <p>{prev.result ? 'WIN' : 'LOSS'}</p>
        </div>
    )
    // return (
    //     <div>prev</div>
    // )
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


async function getSchedule()
{
        let res = await fetch(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule",{ cache: 'no-store' }
    );

    return res.json();
}

async function getLatestGame(id: string) {
    let scoreboardUrl = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";
    let res = await fetch(scoreboardUrl + "/" + id,{ cache: 'no-store' });

    return res.json();
}

async function getPreviousGameResult(prevGameUrl: string) {
    let res = await fetch(prevGameUrl ,{ cache: 'no-store' });

    return res.json();
}

async function getPreviousGame(id: string) {
    let scoreboardUrl = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";
    let res = await fetch(scoreboardUrl + "/" + id,{ cache: 'no-store' });

    return res.json();
}