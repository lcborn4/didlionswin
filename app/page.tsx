import Image from "next/image";
import { Inter } from "@next/font/google";
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
    result: boolean
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
    let offSeason = season.name === 'Off Season' ? true : false;

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
    let res = await fetch(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule", { cache: 'no-store' }
    );

    return res.json();
}

async function checkLatestGame() {

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

    let teamOneScoreUrl = latestGame.competitions[0].competitors[0].score['$ref'];
    let teamOneScore = await getScore(teamOneScoreUrl);

    let teamTwoScoreUrl = latestGame.competitions[0].competitors[1].score['$ref'];
    let teamTwoScore = await getScore(teamTwoScoreUrl);

    game.score = {
        teamOne: teamOneScore.value,
        teamTwo: teamTwoScore.value
    }

    let competitors = latestGame.competitions[0].competitors;
    //     //find the team and result
    competitors.forEach((competitor: any) => {

        if (competitor.id === LIONSID) {
            result = competitor.winner;
        }
    });

    if (!result) {
        game.result = 'In Progress'
    }
    else {
        //update game object
        if (result === typeof Boolean) {
            game.result = result === true ? 'WIN' : 'LOSS';
        }
    }

    let myTimezone = "America/New_York";
    let myDatetimeFormat = "YYYY-MM-DD hh:mm:ss a z";
    game.date = moment(new Date(game.date)).tz(myTimezone).format(myDatetimeFormat);

    return game;
}

async function checkOffSeason() {
    let schedule = await fetch(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule", { cache: 'no-store' }
    );

    return schedule.json();
}

async function getLatestGame(id: string) {
    let scoreboardUrl = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events";
    let latestGame = await fetch(scoreboardUrl + "/" + id, { cache: 'no-store' });

    return latestGame.json();
}

async function getScore(url: string) {
    let score = await fetch(url, { cache: 'no-store' });

    return score.json();
}