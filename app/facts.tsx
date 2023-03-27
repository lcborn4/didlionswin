import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";

const axios = require("axios");
//lions team id = 8
const LIONSID = "8";

export const Facts = (gameResult: boolean) => (
    <Suspense fallback={<RingLoader color="blue" loading />}>
        {/* @ts-expect-error Server Component */}
        <Fact {...gameResult} />
    </Suspense>
);

const Fact = async (gameResult: boolean) => {

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


