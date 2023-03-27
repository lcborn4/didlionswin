import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";

const axios = require("axios");
//lions team id = 8
const LIONSID = "8";

interface Game {
    name: string
    date: string
    result: boolean
}

export const Facts = (game: Game) => (
    <div>
        {/* <div>Game Result: {game.result}</div> */}
        <Suspense fallback={<RingLoader color="blue" loading />}>
            {/* @ts-expect-error Server Component */}
            <Fact {...game} />
        </Suspense>
    </div>
);

const Fact = async (game: Game) => {

    console.log('Inside Fact', game)

    console.log(game.result ? 'WON' : 'LOST')

    //random number generate
    //pull from array of images and stats

    //loss images
    // [] = []
    //win images



    return (
        <div>
            <p>image</p>
            <p>caption</p>
        </div>);
};


