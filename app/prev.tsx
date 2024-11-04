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
    result: string
}

interface Score {
    teamOne: string,
    teamTwo: string
}

async function getPrevGame() {

    let game: any = {};
    let result = false; //initial to loser

    let schedule = await getSchedule();

    //get todays date
    let date = new Date();

    let previousGameIndex = 16;
    schedule.events.forEach((event: any, index: number) => {
        if (Date.parse(event.date) < date.getTime()) {
            previousGameIndex = index - 1;
        }
    })

    game.name = schedule.events[previousGameIndex].name;
    game.date = schedule.events[previousGameIndex].date;

    let previousGameId = schedule.events[previousGameIndex].id;

    let previousGame = await getLatestGame(previousGameId);

    let competitors = previousGame.competitions[0].competitors;

    //find the team and result
    competitors.forEach((competitor: any) => {

        if (competitor.id === LIONSID) {
            result = competitor.winner;
        }
    });


    let teamOneScoreUrl = previousGame.competitions[0].competitors[0].score['$ref'];
    let teamOneScore = await getScore(teamOneScoreUrl);

    let teamTwoScoreUrl = previousGame.competitions[0].competitors[1].score['$ref'];
    let teamTwoScore = await getScore(teamTwoScoreUrl);

    game.score = {
        teamOne: teamOneScore.value,
        teamTwo: teamTwoScore.value
    }

    if (previousGameIndex > 0) {
        //update game object
        game.result = result;

        let myTimezone = "America/New_York";
        let myDatetimeFormat = "YYYY-MM-DD hh:mm:ss a z";
        game.date = moment(new Date(game.date)).tz(myTimezone).format(myDatetimeFormat);
    }
    else {
        game.name = 'NO GAME'
    }

    return game;

}


const GetPrevCondition = async () => {
    const prev = await getPrevGame();

    if (prev.name === 'NO GAME') {
        return (<div>
            Previous Game
            <p>No Game</p>
            <h2 className={inter.className}>
            </h2>
        </div>
        )
    }

    return (

        <div>
            <h2>Previous Game</h2>
            <p>{prev.name}</p>
            <p>{prev.date}</p>
            <p>{prev.score.teamTwo} - {prev.score.teamOne}</p>
            <p>{prev.result ? 'WIN' : 'LOSS'}</p>
        </div>
    )
};

export const PrevCondition = () => (
    <div className={styles.pitch}>
        <Suspense fallback={<RingLoader color="blue" loading />}>
            {/* @ts-expect-error Server Component */}
            <GetPrevCondition />
        </Suspense>
    </div>
);

async function getSchedule() {
    let res = await fetch(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule", { cache: 'no-store' }
    );

    return res.json();
}

async function getLatestGame(id: string) {
    let scoreboardUrl = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";
    let res = await fetch(scoreboardUrl + "/" + id, { cache: 'no-store' });

    return res.json();
}

async function getPreviousGameResult(prevGameUrl: string) {
    let res = await fetch(prevGameUrl, { cache: 'no-store' });

    return res.json();
}

async function getPreviousGame(id: string) {
    let scoreboardUrl = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";
    let res = await fetch(scoreboardUrl + "/" + id, { cache: 'no-store' });

    return res.json();
}

async function getScore(url: string) {
    let score = await fetch(url, { cache: 'no-store' });

    return score.json();
}