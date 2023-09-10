import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "@/styles/Home.module.css";

import moment from "moment-timezone";

import { Condition } from "./condition";
import { PrevCondition } from "./prev";
import { LatestCondition } from "./latest";
import { NextCondition } from "./next";

import { Facts } from "./facts";

const axios = require("axios");
//lions team id = 8
const LIONSID = "8";

const inter = Inter({ subsets: ['latin'] })

interface Game {
    name: string
    date: string
    result: boolean
}

export default async function Home() {

    let game = await getLatestGame();
    let gameResult = game.result;
    console.log('gameResult', gameResult)
    let offSeason = await checkOffSeason();
    console.log('offseason', offSeason);


    if (offSeason) {
        return (
            <>
                <main className={styles.main}>
                    {/* <div className={styles.description}> */}
                    <div>
                        <h1>
                            Did The Detroit Lions Win?
                        </h1>
                    </div>
                    {/* </div> */}

                    OffSeason
                </main>
            </>
        )
    }
    else {

        return (
            <>
                <main className={styles.main}>
                    {/* <div className={styles.description}> */}
                    <div>
                        <h1>
                            Did The Detroit Lions Win?
                        </h1>
                    </div>
                    {/* </div> */}

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

async function getLatestGame() {
    console.log('testing function')

    console.log("checking result");

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

    // console.log("schedule.data", schedule.data);

    //     if(schedule.data.season.name ==='Off Season')
    //     {
    //         offSeason = true;
    //     }

    // console.log("result.data.events length", result.data.events.length);
    // console.log("schedule.data.events", schedule.data.events);
    let scheduleLength = schedule.data.events.length;
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
    schedule.data.events.forEach((event: any ,index: number)=>{
        if(Date.parse(event.date) < date.getTime())
        {
            latestGameIndex = index;

        }
    })
    console.log('latestGame - ',latestGameIndex);

    game.name = schedule.data.events[latestGameIndex].name;
    game.date = schedule.data.events[latestGameIndex].date;

    //old
    // game.name = schedule.data.events[scheduleLength - 1].name;
    // game.date = schedule.data.events[scheduleLength - 1].date;

    let latestGameId = schedule.data.events[latestGameIndex].id;
    //old
    // let latestGameId = schedule.data.events[scheduleLength - 1].id;

    let latestGame = await axios.get(scoreboardUrl + "/" + latestGameId);
    // console.log("latestGame", latestGame);
    let competitors = latestGame.data.competitions[0].competitors;
    //find the team and result
    competitors.forEach((competitor: any) => {
        // console.log("competitor", competitor);

        if (competitor.id === LIONSID) {
            result = competitor.winner;
        }
    });

    //update game object
    game.result = result;
    console.log('returning game: ', game);
    // game.date = new Date(game.date).toString();

    let myTimezone = "America/New-York";
    let myDatetimeFormat= "YYYY-MM-DD hh:mm:ss a z";
    game.date = moment(new Date(game.date)).tz(myTimezone).format(myDatetimeFormat);

    return game;
}

async function checkOffSeason() {
    let schedule = await axios.get(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/8/schedule"
    );

    // console.log("schedule.data", schedule.data);

    return schedule.data.season.name === 'Off Season' ? true : false;
}