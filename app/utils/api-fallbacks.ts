// API fallbacks for static generation
// These provide default data when ESPN API is unavailable during build

export const fallbackSchedule = {
    events: [
        {
            id: "401671768",
            name: "Detroit Lions vs TBD",
            date: "2024-09-15T17:00:00Z",
            competitions: [
                {
                    competitors: [
                        {
                            id: "8",
                            team: { displayName: "Detroit Lions" },
                            homeAway: "home"
                        },
                        {
                            id: "1",
                            team: { displayName: "TBD" },
                            homeAway: "away"
                        }
                    ]
                }
            ]
        }
    ]
};

export const fallbackSeason = {
    season: {
        name: "Regular Season"
    }
};

export const fallbackGame = {
    name: "Detroit Lions vs TBD",
    date: "2024-09-15T17:00:00Z",
    result: "Loading...",
    score: {
        teamOne: 0,
        teamTwo: 0
    }
};

export const fallbackGameData = {
    competitions: [
        {
            competitors: [
                {
                    id: "8",
                    team: { displayName: "Detroit Lions" },
                    score: { "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401671768/competitions/401671768/competitors/8/score" },
                    winner: undefined
                },
                {
                    id: "9",
                    team: { displayName: "TBD" },
                    score: { "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401671768/competitions/401671768/competitors/9/score" },
                    winner: undefined
                }
            ],
            status: { "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401671768/competitions/401671768/status" }
        }
    ]
};

export const fallbackScore = {
    value: 0
};

export const fallbackStatus = {
    type: {
        name: "STATUS_SCHEDULED"
    }
};
