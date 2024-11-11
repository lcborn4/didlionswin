import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";
import moment from "moment-timezone";


//lions team id = 8
const LIONSID = "8";

interface Game {
    name: string
    date: string
    result: string
}

async function nextGame() {

    let game: any = {};
    let result = false; //initial to loser

    let schedule = await getSchedule();

    //get todays date
    let date = new Date();

    let nextGameIndex = 16;
    schedule.events.forEach((event: any, index: number) => {
        if (Date.parse(event.date) < date.getTime()) {
            if (index !== 16) {
                nextGameIndex = index + 1;
            }
        }
    })

    game.name = schedule.events[nextGameIndex].name;
    game.date = schedule.events[nextGameIndex].date;

    let nextGameId = schedule.events[nextGameIndex].id;

    let nextGame = await getLatestGame(nextGameId);

    let competitors = nextGame.competitions[0].competitors;

    //find the team and result
    competitors.forEach((competitor: any) => {

        if (competitor.id === LIONSID) {
            result = competitor.winner;
        }
    });


    // let teamOneScoreUrl = previousGame.competitions[0].competitors[0].score['$ref'];
    // let teamOneScore = await getScore(teamOneScoreUrl);

    // let teamTwoScoreUrl = previousGame.competitions[0].competitors[1].score['$ref'];
    // let teamTwoScore = await getScore(teamTwoScoreUrl);

    // game.score = {
    //     teamOne: teamOneScore.value,
    //     teamTwo: teamTwoScore.value
    // }
    console.log('game', game)
    if (nextGameIndex <= 16) {
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
        </div>
    )
};

export const NextCondition = () => (
    <div className={styles.pitch}>
        <Suspense fallback={<RingLoader color="blue" loading />}>
            {/* @ts-expect-error Server Component */}
            <GetNextCondition />
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

async function getNextGameResult(nextGameUrl: string) {
    let res = await fetch(nextGameUrl, { cache: 'no-store' });

    return res.json();
}

async function getNextGame(id: string) {
    let scoreboardUrl = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";
    let res = await fetch(scoreboardUrl + "/" + id, { cache: 'no-store' });

    return res.json();
}