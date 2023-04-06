import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";

import badFacts from '../assets/bad_facts.json';
import goodFacts from '../assets/good_facts.json';

const axios = require("axios");
//lions team id = 8
const LIONSID = "8";

const IMAGEMAXNUM = 10;//10 images 
const GOODFACTMAXNUM = 10;//10 quotes
const BADFACTMAXNUM = 8;//8 quotes

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
    let gameResult: boolean = game.result;
    gameResult = false;

    // random image

    let randomImageNum = getRandomInt(IMAGEMAXNUM);

    if (!gameResult) {
        // bad images
    }
    else {
        //good images
    }


    // random fact
    //default with good images
    let randomFactNum = getRandomInt(GOODFACTMAXNUM)
    let fact: string = '';

    if (!gameResult) {
        let randomFactNum = getRandomInt(BADFACTMAXNUM);
        fact = badFacts[randomFactNum].fact;
    }
    else {
        fact = goodFacts[randomFactNum].fact;
    }

    console.log('random image num', randomImageNum);
    console.log('random fact num', randomFactNum)

    return (


        <div>
            <p>image</p>
            <p>{fact}</p>
        </div>);
};

//get random number
//generate image
function getRandomInt(num: number) {
    return Math.floor(Math.random() * num);
}