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

    //sget todays date
    let date = new Date();

    //find the latestGame
    let latestGameIndex = 16; //default to last game
    schedule.events.forEach((event: any, index: number) => {
        if (Date.parse(event.date) < date.getTime()) {
            latestGameIndex = index;

        }
    })

    game.name = schedule.events[latestGameIndex].name;
    game.date = schedule.events[latestGameIndex].date;

    let latestGameId = schedule.events[latestGameIndex].id;

    let latestGame = await getLatestGame(latestGameId);
    let competitors = latestGame.competitions[0].competitors;
    let nextCompetition = null;
    //find the team and result
    competitors.forEach((competitor: any) => {

        if (competitor.id === LIONSID) {
            result = competitor.winner;
            nextCompetition = competitor.nextCompetition;
        }
    });

    if (nextCompetition) {
        let nextGameUrl = nextCompetition['$ref']
        let nextGameResult = await getNextGameResult(nextGameUrl);
        let nextGameId = nextGameResult.id;
        let nextGame = await getNextGame(nextGameId);
        game.name = nextGame.name;
        game.date = nextGame.date;
        let nextCompetitors = nextGameResult.competitors;
        //loop through until lions
        nextCompetitors.forEach((competitor: any) => {
            if (competitor.id === LIONSID) {
                result = competitor.winner || 'upcoming';
            }
        });
    }
    else {
        game.name = 'NO GAME'
    }
    //update game object
    game.result = result;
    let myTimezone = "America/New_York";
    let myDatetimeFormat = "YYYY-MM-DD hh:mm:ss a z";
    game.date = moment(new Date(game.date)).tz(myTimezone).format(myDatetimeFormat);

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