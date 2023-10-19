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
        <Suspense fallback={<RingLoader color="blue" loading />}>
            {/* @ts-expect-error Server Component */}
            <Fact {...game} />
        </Suspense>
    </div>
);

const Fact = async (game: Game) => {

    let gameResult: boolean = game.result;

    // random image

    let randomImageNum = getRandomInt(GOODIMAGEMAXNUM);
    let randomImage: string = '';

    if (!gameResult) {
        let randomImageNum = getRandomInt(BADIMAGEMAXNUM);
        // bad images
        randomImage = badImages[randomImageNum].image;
    }
    else {
        //good images
        randomImage = goodImages[randomImageNum].image;
    }

    //roar
    randomImage = './images/aslan-roar.gif';

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

    return (

        <div>
            <div className={styles.randomimage}>
            <Image
                alt="Bad"
                src={randomImage}
                width={200}
                height={200}
                sizes="100vw"
                style={{
                    objectFit: 'cover',
                }}
            />
            </div>
            <p><span className={styles.didyouknow}>Did you know? </span>{fact}</p>
        </div>);
};

//get random number
//generate image
function getRandomInt(num: number) {
    return Math.floor(Math.random() * num);
}