import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";
import moment from "moment-timezone";

 
//lions team id = 8
const LIONSID = "8";

interface Game {
    name: string
    date: string
    result: boolean
}

async function nextGame() {
    // console.log('testing function')

    // console.log("checking result");

    let game: any = {};
    let result = false; //initial to loser

    let schedule = await getSchedule();

    let scoreboardUrl =
        "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";

    // let gameScore = await fetch(
    //   "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401437952/competitions/401437952/competitors/8/score?lang=en&region=us",{ cache: 'no-store' }
    // );

    // console.log("result.data", result.data);
    // console.log("result.data.events length", result.data.events.length);
    // console.log("schedule.data.events", schedule.data.events);
    let scheduleLength = schedule.events.length;
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
    console.log('latestGame - ',latestGameIndex);

    game.name = schedule.events[latestGameIndex].name;
    game.date = schedule.events[latestGameIndex].date;

    //old
    // game.name = schedule.data.events[scheduleLength - 1].name;
    // game.date = schedule.data.events[scheduleLength - 1].date;

    let latestGameId = schedule.events[latestGameIndex].id;
    //old
    // let latestGameId = schedule.data.events[scheduleLength - 1].id;

    let latestGame = await getLatestGame(latestGameId);
    // console.log("Next - latestGame.data", latestGame.data);
    let competitors = latestGame.competitions[0].competitors;
    let nextCompetition = null;
    // console.log('competitors', competitors);
    //find the team and result
    competitors.forEach((competitor: any) => {
        // console.log("current competitor", competitor);

        if (competitor.id === LIONSID) {
            result = competitor.winner;
            nextCompetition = competitor.nextCompetition;
        }
    });

    if (nextCompetition) {
        let nextGameUrl = nextCompetition['$ref']
        // console.log('nextGameUrl', nextGameUrl)
        let nextGameResult = await getNextGameResult(nextGameUrl);
        // console.log('nextGameResult.data', nextGameResult.data);
        let nextGameId = nextGameResult.id;
        // console.log('nextGameId', nextGameId)
        let nextGame = await getNextGame(nextGameId);
        // console.log('nextGame.Data', nextGame.data);
        game.name = nextGame.name;
        game.date = nextGame.date;
        let nextCompetitors = nextGameResult.competitors;
        //loop through until lions
        nextCompetitors.forEach((competitor: any) => {
            // console.log("competitor", competitor);
            if (competitor.id === LIONSID) {
                result = competitor.winner || 'upcoming';
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
    let myTimezone = "America/New_York";
    let myDatetimeFormat= "YYYY-MM-DD hh:mm:ss a z";
    game.date = moment(new Date(game.date)).tz(myTimezone).format(myDatetimeFormat);

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
    const next = await nextGame();
    if (next.name === 'NO GAME') {
        return (<div>
            <h2>Next Game</h2>
            <p>No Game</p>
        </div>
        )
    }

    return (
        <div>
            <h2>Next Game</h2>
            <p>{next.name}</p>
            <p>{next.date}</p>
            {/* <p>{next.result ? 'WIN' : 'LOSS'}</p> */}
        </div>
    )
    // return (
    //     <div>Next</div>
    // )
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

async function getNextGameResult(nextGameUrl: string) {
    let res = await fetch(nextGameUrl ,{ cache: 'no-store' });

    return res.json();
}

async function getNextGame(id: string) {
    let scoreboardUrl = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";
    let res = await fetch(scoreboardUrl + "/" + id,{ cache: 'no-store' });

    return res.json();
}