// Game model

//TODO : add method to send push notification to all players on game update, except to the player who
// created the changed state. i.e. dont send a push notification to the player who updated the photo.


var mongoose = require('mongoose'),
    deepPopulate = require('mongoose-deep-populate'),
    User = require('mongoose').model('User'),
    Round = require('mongoose').model('Round'),
    Schema = mongoose.Schema,
    events = require('events'),
    Events = require('../events/events.server'),
    states = require('./states.server.enum'),
    eventEmitter = new events.EventEmitter();

var GameSchema = new Schema({
    gameName: String,
    roundTimeLimit: { type: Number, default: 720 }, // In minutes. 720 == 12 hours
    numberOfRounds: { type: Number, default: 10 }, // TODO: Should be points to win, right?
    currentRound: { type: Number, default: 1 },
    rounds: [{type: Schema.ObjectId, ref: 'Round'}],
    players: [{type: Schema.ObjectId, ref: 'User'}],
    playersJoined: [{type: Schema.ObjectId, ref: 'User'}],
    timeCreated: { type: Date, default: Date.now },
    timeLastModified: { type: Date, default: Date.now },
    timeEnded: Date,
    state: { type: String, default: states.gameStates.NOT_STARTED}
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
                this.gameName = this._id.toString().slice(-5);

        // TODO: this is crude. add some validation?
        if(!this.gameStarted && this.playersJoined.length == this.players.length){
            this.gameStarted = true;
            process.emit(Events.gameStarted, this);
        }

        next();
    }
);

// TODO: Make this leaner. this will be a heavy operation.

// This is an automatically called function when a Game document is removed
// from MongoDB. This removes the game for all users who were invited or playing the game.

// This will also remove all rounds that were apart of the game.
GameSchema.post('remove', function (doc) {
    // Remove references
    var game = doc;
    console.log("Game post remove. Removed game: " + game._id);
    for (var i = 0; i < game.players.length; i++){
        var userId = game.players[i];
        console.log("Removing games and invites for userID: " + userId);

        // grab user, then update games and invitations
            User.find(userId).then(function(user){
                console.log("Found User from id: " + user.username);

                console.log(" - looking for game: " + game._id);

                var gameIndex = user.games.indexOf(game._id);
                console.log("users games: " + JSON.stringify(user.games));
                console.log(" --ndx: " + gameIndex);

                var inviteIndex = user.invitations.indexOf(game._id);
                console.log("users invitations: " + JSON.stringify(user.invitations));
                console.log(" --ndx: " + inviteIndex);


                if (gameIndex > -1) {
                    console.log("Removing game from user");
                    user.games.splice(gameIndex, 1);
                }
                if (inviteIndex > -1) {
                    console.log("Removing invite from user");
                    user.invitations.splice(inviteIndex, 1);
                }
                user.save();
            }).then(function(savedUser) {
                console.log("Updated user with removed game.");
            }).catch(function(err){
                console.log("Error remove game from user");
            });
    }

    //TODO: Remove Rounds
    Round.remove({ _id : { $in: game.rounds } }).then(function (roundsRemoved) {
        console.log("Remove rounds : " + JSON.stringify(roundsRemoved));
    }).catch(function (err) {
        console.log("Error removing Rounds for game: " + game._id);
    })

});

mongoose.model('Game', GameSchema);