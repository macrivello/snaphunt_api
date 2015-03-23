// Game model

//TODO : add method to send push notification to all players on game update, except to the player who
// created the changed state. i.e. dont send a push notification to the player who updated the photo.

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GameSchema = new Schema({
    roundTimeLimit: { type: Number, default: 720 }, // In minutes. 720 == 12 hours
    numberOfRounds: { type: Number, default: 10 }, // TODO: Should be points to win, right?
    currentRound: { type: Number, default: 0 }, // '0' will also indicate game has not started
    rounds: [{type: Schema.ObjectId, ref: 'Round'}],
    players: [{type: Schema.ObjectId, ref: 'UserDigest'}],
        //“user._ID” : boolean,
    timeCreated: { type: Date, default: Date.now },
    timeLastModified: { type: Date, default: Date.now },
    timeEnded: Date,
    gameOver: { type: Boolean, default: false },
    gameStarted: { type: Boolean, default: false }
});

// TODO: Any preprocessing work to do?
GameSchema.pre('save',
    function(next) {
        next();
    }
);

mongoose.model('Game', GameSchema);