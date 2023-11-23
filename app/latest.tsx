import styles from "@/styles/Home.module.css";
interface Game {
    name: string
    date: string
    result: string
    score: Score
}

interface Score {
    teamOne: string,
    teamTwo: string
}

export const LatestCondition = (game: Game) => {

    return (
        <div className={styles.pitch}>
            <div>
                <h2>Latest Game</h2>
                <p>{game.name}</p>
                <p>{game.date}</p>
                <p>{game.score.teamTwo} - {game.score.teamOne}</p>
                <p>{game.result}</p>
            </div>
        </div>
    )
};