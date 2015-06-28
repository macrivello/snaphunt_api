// Game model

//TODO : add method to send push notification to all players on game update, except to the player who
// created the changed state. i.e. dont send a push notification to the player who updated the photo.

var mongoose = require('mongoose'),
    deepPopulate = require('mongoose-deep-populate'),
    User = require('mongoose').model('User'),
    Schema = mongoose.Schema;

var GameSchema = new Schema({
    gameName: String,
    roundTimeLimit: { type: Number, default: 720 }, // In minutes. 720 == 12 hours
    numberOfRounds: { type: Number, default: 10 }, // TODO: Should be points to win, right?
    currentRound: { type: Number, default: 0 }, // '0' will also indicate game has not started
    rounds: [{type: Schema.ObjectId, ref: 'Round'}],
    players: [{type: Schema.ObjectId, ref: 'UserDigest'}],
    timeCreated: { type: Date, default: Date.now },
    timeLastModified: { type: Date, default: Date.now },
    timeEnded: Date,
    gameOver: { type: Boolean, default: false },
    gameStarted: { type: Boolean, default: false }
});

// Register Plugins.
// deepPopulate(plugin, options);
GameSchema.plugin(deepPopulate, null);

// TODO: Any preprocessing work to do?
GameSchema.pre('save',
    function(next) {
        this.timeLastModified = Date.now();

        // TODO: Make default gamename a random phrase?
        if(!this.gameName || this.gameName == "")
            this.gameName = this._id.toString();

        next();
    }
);

GameSchema.post('remove', function (doc) {
    // Remove references
    var game = doc;
    console.log("Game post remove. Removed game: " + game._id);
    for (var i = 0; i < game.players.length; i++){
        var user = game.players[i];
        var userGames = user.games;
        var userInvites = user.invitations;

        var gameIndex = userGames.indexOf(game._id);
        var inviteIndex = userInvites.indexOf(game._id);
        if (gameIndex > -1) {
            console.log("Removing game from user");
            userGames = userGames.splice(gameIndex, 1);
        }
        if (inviteIndex > -1) {
            console.log("Removing invite from user");
            userInvites = userInvites.splice(inviteIndex, 1);
        }

        user.save();
    }

    //TODO: Remove Rounds
});

mongoose.model('Game', GameSchema);