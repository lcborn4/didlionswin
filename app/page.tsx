import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "@/styles/Home.module.css";

import { Condition } from "./condition";
import { PrevCondition } from "./prev";
import { CurrentCondition } from "./current";
import { NextCondition } from "./next";

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

    let game = await testFunction();

    return (
        <>
            <main className={styles.main}>
                {/* <div className={styles.description}> */}
                <div>
                    Did The Detroit Lions Win?
                </div>
                {/* </div> */}
                <Condition {...game} />


                <div className={styles.grid}>
                    <div>
                        <PrevCondition {...game} />
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
                    </div>
                    <div>
                        <CurrentCondition {...game} />
                    </div>
                    <div>
                        <NextCondition {...game} />
                    </div>

                </div>
            </main>
        </>
    );
}

async function testFunction() {
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

    // console.log("result.data", result.data);
    // console.log("result.data.events length", result.data.events.length);
    console.log("schedule.data.events", schedule.data.events);
    let scheduleLength = schedule.data.events.length;
    //full event
    console.log(
        "schedule.data.events[scheduleLength]",
        schedule.data.events[scheduleLength - 1]
    );

    console.log(
        "schedule.data.events[scheduleLength].name",
        schedule.data.events[scheduleLength - 1].name
    );

    game.name = schedule.data.events[scheduleLength - 1].name;
    game.date = schedule.data.events[scheduleLength - 1].date;

    let latestGameId = schedule.data.events[scheduleLength - 1].id;

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
    return game;

    // console.log('returning game: ', game);

}