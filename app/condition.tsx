interface Game {
    name: string
    date: string
    result: string
}

export const Condition = (game: Game) => {

    /// yes
    //nope
    let gameResult = '';
    switch (game.result) {
        case 'In Progress':
            gameResult = 'In Progress';
            break;
        case 'WIN':
            gameResult = 'Yes';
            break;
        case 'LOSS':
            gameResult = 'Nope';
            break;
    }

    return (
        <div>
            <div>
                <p>{gameResult}</p>
            </div>
        </div>
    )
};