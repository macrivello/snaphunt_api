var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    Game = Promise.promisifyAll(require('mongoose').model('Game')),
    Round = Promise.promisifyAll(require('mongoose').model('Round')),
    Photo = Promise.promisifyAll(require('mongoose').model('Photo')),
    User = Promise.promisifyAll(require('mongoose').model('User')),
    UserDigest = Promise.promisifyAll(require('mongoose').model('UserDigest')),
    Theme = Promise.promisifyAll(require('mongoose').model('Theme')),
    event = require('events'),
    Events = require('../events/events.server'),
    eventEmitter = new event.EventEmitter();

//TODO: Assert new user is a player in the game.
//TODO: Add new game to invitations of other players

exports.create = function(req, res, next) {
    if (!req.body) {
        console.log("Empty request body. Can't create game.");
        return res.status(401).send("Empty request body. Can't create game.");
    }

    var user = req.user; // this should be valid since its an authenticated route
    var game = new Game(req.body);
    var rounds;

    var i;
    // TODO: add a GameOptions model for Users that would include number of themes to choose from
    // TODO: currently just using same three themes for each round
    Theme.findRandom({}, {}, { limit: 3  }).execAsync()
        .then(function(themes) {
            if (themes && themes.length < 3) {
                console.log('Creating new themes');
                // Create 3 dummy themes
                var newThemes = [{phrase: 'test'}, {phrase: 'test2'}, {phrase: 'test3'}];

                return Theme.createAsync(newThemes);
            }

            return themes;
        }).then(function (themes) {
            // create Theme array to add to Rounds
            //console.log("Themes.findRandom returned: " + JSON.stringify(themes));
            var themeIds = [];
            for (i = 0; i < themes.length; i++){
                themeIds.push(themes[i]._id);
            }

            // Create rounds for game.
            // TODO : a cleaner solution please...
            var r = [];
            console.log("number of rounds: " + game.numberOfRounds);
            for (i = 0; i < game.numberOfRounds; i++) {
                r.push({roundNumber: i+1,
                        themes: themeIds});
            }

            return Round.createAsync(r);
        }).then(function(roundsReturned) {
            console.log("Created Rounds for new Game");

            var numRounds = roundsReturned.length;
            if (numRounds != game.numberOfRounds) {
                console.log("Error creating %d rounds. Only created %d ", game.numberOfRounds, numRounds);
                return res.status(500).send("Error creating new game. ");
            }

            var rounds = roundsReturned;
            for (i = 0; i < numRounds; i++) {
                var round = rounds[i];
                if (i == 0) {
                    round.judge = user.userDigest;
                }
                game.rounds[i] = round._id;
            }

            return game.saveAsync();
        }).then(function(gameSaved){
            var game = gameSaved[0];
            console.log("User: " + user.username);
            console.log("New Game created. Game: " + game._id);

            process.emit(Events.gameCreated, { "userDigestIdOfCreator" : user.userDigest, "game" : game});

            user.games.push(game._id);

            return user.saveAsync();
        }).then(function(_user){
            var user = _user[0];
            console.log("Updated %s with new game.", user.username);

            // TODO: Set as invitation to players. Send out push notifications.

            return res.json(game);
        }).catch(function(err){
            console.log("Error creating new game. " + err);

            return res.status(500).send("Error creating new game. " + err);
        });
};

// Add Game object with id 'gameId' to request object field, req.game
exports.getGame = function (req, res, next, gameId){
    console.log("get game");
    if (!gameId) {
        console.log("Unable to find game. Invalid id.");
        res.status(401).send("Unable to find game. Invalid id.");
        return;
    }

    // TODO: make sure gameId is in user.games
    // req.user should be valid since its an auth route.
    Game.findByIdAsync(gameId)
        .then(function(game){
            req.game = game;
            next();
        }).catch(function(err){
            return res.status(500).send("Error finding game by ID");
        });

};

// TODO: populate Rounds and Players fields before returning Game object
exports.read = function(req, res, next){
    var game = req.game;    // This should be populated by getGame()

    if (!game)
        return res.status(500).send("Unable to read game.");

    // Return game object with rounds and players field populated
    game.deepPopulate('rounds.themes', 'players', function (err, _game) {
        if (err) {
            console.log("Error populating rounds in Game object.", err);
            return res.status(500).send("Unable to read game.", err);
        }

        return res.json(_game);
    });

    //Round.populateAsync(req.game, { path: 'rounds'})
    //    .then(function(gameWithRounds) {
    //        console.log("populated round in Game: " + gameWithRounds._id);
    //        return UserDigest.populateAsync(gameWithRounds, {path: 'players'});
    //    }).then(function(gameWithRoundsAndPlayers) {
    //        console.log("populated players in Game: " + gameWithRoundsAndPlayers._id);
    //        return res.json(gameWithRoundsAndPlayers);
    //    })
};

exports.update = function(req, res, next){
    var game = req.game;
    if (!game)
        return res.status(500).send("Unable to read game.");

    if (!req.body)
        return res.status(500).send("Invalid request body.");


    game.update(req.body)
        .then(function(game){
            console.log("Successfully updated game.");
            res.json(game);
        }).catch(function(err){
           return res.status(500).send("Error updating game. " + err);
        });
};

// TODO : delete rounds, delete games
exports.delete = function(req, res, next){
    var game = req.game;
    var user = req.user;

    if (!game)
        return res.status(500).send("Unable to read game.");

    game.removeAsync()
        .then(function(err){
            console.log("Successfully deleted game.");
            return res.json(game);
        }).catch(function(err){
            return res.status(500).send("Error deleting game. " + err);
        });
};

exports.list = function(req, res, next){
    var user = req.user;
    if (!user)
        return res.status(500).send("Unable to read user.");

    user.deepPopulate('games.rounds.themes', 'games.players', function (err, _user) {
        if (err) {
            console.log("Error populating populated Game objects.", err);
            return res.status(500).send("Unable to read game list.", err);
        }
        var games = _user.games;
        return res.json(games);
    });

    //Game.populateAsync(user, { path: 'games'})
    //    .then(function(userWithGamesPopulated){
    //        var games = userWithGamesPopulated.games;
    //        console.log("Found games \n '%s' \n for user: '%s'", JSON.stringify(games), user.username);
    //        return res.json(games)
    //    }).catch(function(err){
    //        console.log("Error populating games");
    //        return res.status(500).send("Unable populating games for %s.", user.username);
    //    });
};

exports.deleteAll = function(req, res, next) {
    var user = req.user;
    user.games = [];

    user.saveAsync()
        .then(function(user) {
            return Game.removeAsync({})
        }).then(function (games, err) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send("Deleted games for user: " + user.username);
            }
        });
};

// Invites
exports.listInvites = function(req, res, next){
    var user = req.user;
    if (!user)
        return res.status(500).send("Unable to read user.");

    user.deepPopulate('invitations.rounds.themes', 'invitations.players', function (err, _user) {
        if (err) {
            console.log("Error populating populated Game objects.", err);
            return res.status(500).send("Unable to read game list.", err);
        }

        var invitations = _user.invitations;
        return res.json(invitations);
    });

};

exports.deleteInvites = function(req, res, next) {
    var user = req.user;
    if (!user)
        return res.status(500).send("Unable to read user.");

    user.invitations = [];

    user.saveAsync()
        .then(function(user) {
            //TODO: need to handle how game is affected with a user deleting invitation
            //return Game.removeAsync({})
            return;
        }).then(function (games, err) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send("Deleted invitations for user: " + user.username);
            }
        });
};

// Non-exported functions