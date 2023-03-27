import styles from "@/styles/Home.module.css";
import { cache, Suspense } from "react";
import { RingLoader } from "react-spinners";

const axios = require("axios");
//lions team id = 8
const LIONSID = "8";

export const Facts = (gameResult: boolean) => (
    <div className={styles.pitch}>
        <div>
            Facts
            {gameResult ? 'Win' : 'Loss'}
        </div>
    </div>
);

