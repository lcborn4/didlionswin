import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";

import moment from "moment-timezone";

import { Condition } from "./condition";
import { PrevCondition } from "./prev";
import { LatestCondition } from "./latest";
import { NextCondition } from "./next";

import { Facts } from "./facts";

//lions team id = 8
const LIONSID = "8";

interface Game {
    name: string
    date: string
    result: string
    score: Score
}

interface Score {
    teamOne: string,
    teamTwo: string
}

//testing sourcetree
export default async function Home() {

    let game = await checkLatestGame();
    let season = await checkOffSeason();

    let offSeason = season.season.name === 'Off Season' ? true : false;

    if (offSeason) {
        return (
            <>
                <main className={styles.main}>
                    <div>
                        <h1>
                            Did The Detroit Lions Win?
                        </h1>
                    </div>

                    OffSeason
                </main>
            </>
        )
    }
    else {

        return (
            <>
                <main className={styles.main}>
                    <div>
                        <h1>
                            Did The Detroit Lions Win?
                        </h1>
                    </div>

                    <Condition {...game} />
                    <Facts {...game} />

                    <div className={styles.grid}>
                        <div>
                            <PrevCondition />
                        </div>
                        <div>
                            <LatestCondition {...game} />
                        </div>
                        <div>
                            <NextCondition />
                        </div>

                    </div>
                </main>
            </>
        );
    }
}

async function getSchedule() {
    const { safeFetch } = await import('./utils/safe-fetch');
    let res = await safeFetch(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule", { cache: 'no-store' }
    );

    return res.json();
}

async function checkLatestGame() {

    let game: any = {};
    let result = ''; //initial to loser

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

    let teamOneScoreUrl = latestGame.competitions[0].competitors[0].score['$ref'];
    let teamOneScore = await getScore(teamOneScoreUrl);

    let teamTwoScoreUrl = latestGame.competitions[0].competitors[1].score['$ref'];
    let teamTwoScore = await getScore(teamTwoScoreUrl);
    // console.log('latestGame - status', latestGame.competitions[0].status);
    let latestGameStatusUrl = latestGame.competitions[0].status['$ref'];
    let latestGameStatus = await getLatestGameStatus(latestGameStatusUrl);

    // console.log('latestGameStatus', latestGameStatus)

    game.score = {
        teamOne: teamOneScore.value,
        teamTwo: teamTwoScore.value
    }

    let competitors = latestGame.competitions[0].competitors;
    //find the team and result
    competitors.forEach((competitor: any) => {

        if (competitor.id === LIONSID) {
            if (competitor.winner !== undefined) {
                result = competitor.winner ? 'WIN' : 'LOSS';
            }

        }
    });

    game.result = result;
    if (result === '') {
        console.log('game is in progress')
        game.result = 'In Progress'
    }
    // console.log('game', game);
    let myTimezone = "America/New_York";
    let myDatetimeFormat = "YYYY-MM-DD hh:mm:ss a z";
    game.date = moment(new Date(game.date)).tz(myTimezone).format(myDatetimeFormat);

    return game;
}

async function checkOffSeason() {
    const { safeFetch } = await import('./utils/safe-fetch');
    let schedule = await safeFetch(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule", { cache: 'no-store' }
    );

    return schedule.json();
}

async function getLatestGame(id: string) {
    const { safeFetch } = await import('./utils/safe-fetch');
    let scoreboardUrl = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";
    let latestGame = await safeFetch(scoreboardUrl + "/" + id, { cache: 'no-store' });

    return latestGame.json();
}

async function getLatestGameStatus(url: string) {
    const { safeFetch } = await import('./utils/safe-fetch');
    let latestGameStatus = await safeFetch(url, { cache: 'no-store' });

    return latestGameStatus.json();
}

async function getScore(url: string) {
    const { safeFetch } = await import('./utils/safe-fetch');
    let score = await safeFetch(url, { cache: 'no-store' });

    return score.json();
}