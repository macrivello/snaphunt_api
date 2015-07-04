module.exports = {
    gameStates : {
        // mongoose enum object requires 'values' array
        NOT_STARTED: "NOT_STARTED",
        STARTED: "STARTED",
        ENDED: "ENDED"
    },
    roundStates : {
        // mongoose enum object requires 'values' array
        NOT_STARTED: "NOT_STARTED",
        NO_THEME: "NO_THEME",
        PLAYING: "PLAYING",
        JUDGE_SELECTION: "JUDGE_SELECTION",
        ENDED: "ENDED"
    }
};