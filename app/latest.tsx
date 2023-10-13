import styles from "@/styles/Home.module.css";

interface Game {
    name: string
    date: string
    result: boolean
}

export const LatestCondition = (game: Game) => (
    <div className={styles.pitch}>
        <div>
            <h2>Latest Game</h2>
            <p>{game.name}</p>
            <p>{game.date}</p>
            <p>{game.result ? 'WIN' : 'LOSS'}</p>
        </div>
    </div>
);