import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";
import Image from 'next/image'

//images
import badImages from '../assets/bad_images.json';
import goodImages from '../assets/good_images.json';

//facts
import badFacts from '../assets/bad_facts.json';
import goodFacts from '../assets/good_facts.json';

import mountains from '../public/images/bad/bearsthanksgiving2021.jpeg';

const axios = require("axios");
//lions team id = 8
const LIONSID = "8";

const BADIMAGEMAXNUM = 5;//5 images 
const GOODIMAGEMAXNUM = 3;//3images 
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
    // gameResult = false;

    // random image

    let randomImageNum = getRandomInt(GOODIMAGEMAXNUM);
    let randomImage: string = '';

    if (!gameResult) {
        let randomImageNum = getRandomInt(BADIMAGEMAXNUM);
        console.log('badImages[randomImageNum].image', badImages[randomImageNum].image)
        // bad images
        randomImage = badImages[randomImageNum].image;
    }
    else {
        //good images
        console.log('badImages[randomImageNum].image', goodImages[randomImageNum].image)
        randomImage = goodImages[randomImageNum].image;
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
            <Image
                alt="Bad"
                src={randomImage}
                width={200}
                height={200}
                // fill
                sizes="100vw"
                style={{
                    objectFit: 'cover',
                }}
            />
            <p>{fact}</p>
        </div>);
};

//get random number
//generate image
function getRandomInt(num: number) {
    return Math.floor(Math.random() * num);
}