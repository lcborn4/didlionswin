interface Game {
    name: string
    date: string
    result: boolean
}

export const Condition = (game: Game) => (
    <div>
        <div>
            <p>{game.result ? 'Yes' : 'Nope'}</p>
        </div>
    </div>
);