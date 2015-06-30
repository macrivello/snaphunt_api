var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    Game = require('mongoose').model('Game'),
    Round = require('mongoose').model('Round'),
    Photo = require('mongoose').model('Photo'),
    User = require('mongoose').model('User'),
    UserDigest = require('mongoose').model('UserDigest'),
    Theme = require('mongoose').model('Theme'),
    event = require('events'),
    ObjectId = require('mongoose').Types.ObjectId,
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

    var ids = req.query.id;
    if (ids){
        // Add creator of game to first position in list, this
        //  helps when setting users as judge
        console.log("Adding creator to game players: " + user.userDigest);
        game.players.push(user.userDigest);

        if (ids instanceof Array){
            for (var i = 0; i < ids.length; i++) {
                console.log("Adding player to game: " + ids[i]);
                game.players.push(new ObjectId(ids[i]));
            }
        } else {
            console.log("Adding player to game: " + ids);
            game.players.push(new ObjectId(ids));
        }
    } else {
        console.log("Invalid player IDs in query parameters.");
        res.status(401).send("Invalid player IDs in query parameters");
    }

    var i, r = [];
    // TODO: don't make numThemeChoices hardcoded
    var numThemeChoices = 3;
    var tempRound, numPlayers = game.players.length, numRounds = game.numberOfRounds;

    Theme.findRandom().limit(numRounds * numThemeChoices).exec(function (err, themes) {
        if (err) {
            console.log(err, "Error creating new game - theme population");
            return res.status(500).send(err);
        }

        var numThemes = themes.length ? themes.length : 0;
        console.log("theme findrandom return : " + JSON.stringify(themes));

        for (i = 0; i < game.numberOfRounds; i++) {
            tempRound = new Round();
            tempRound.roundNumber = i+1;
            tempRound.judge = game.players[i % numPlayers];
            tempRound.themes = [];

            for (var j = 0; j < numThemeChoices; j++) {
                // this looks kind of funky.
                var ndx = ((i * numThemeChoices) % numThemes);
                var themeToAdd = themes[ndx + j]._id;

                console.log("Adding theme %s to round %s", themeToAdd, tempRound._id);
                tempRound.themes.push(themeToAdd);
            }

            r.push(tempRound);
        }

        Round.createAsync(r)
            .then(function(roundsCreated) {
                var roundIds = [];
                var numRounds = roundsCreated.length;
                console.log("%d rounds created.", numRounds);
                for (i = 0; i < numRounds; i++) {
                    roundIds.push(roundsCreated[i]._id);
                }
                game.rounds = roundIds;

                return game.saveAsync();
            }).then(function(gameSaved){
                game = gameSaved[0];
                console.log("User: " + user.username);
                console.log("New Game created. Game: " + game.gameName);

                process.emit(Events.gameCreated, { "usernameOfCreator" : user.username , "userDigestIdOfCreator" : user.userDigest, "game" : game});

                user.games.push(game._id);

                return user.saveAsync();
            }).then(function(_user) {
                console.log("Saved new game.");
                res.json(game);
            }).catch(function(err) {
                console.log(err, "Error creating new game");
                res.status(500).send(err);
            });

    });

    // TODO: add a GameOptions model for Users that would include number of themes to choose from
    // TODO: currently just using same three themes for each round
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

    res.json(game);
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

    if (user.admin) {
        Game.find({}).then(function(games) {
            console.log("Returning all games in DB");
            return res.json(games);
        }).catch(function(err) {
            console.log(err, "Error returning games");
            return res.status(500).send(err, "Error returning games");
        })
    } else {
        user.deepPopulate('games.rounds.themes', 'games.players', function (err, _user) {
            if (err) {
                console.log("Error populating populated Game objects.", err);
                return res.status(500).send("Unable to read game list.", err);
            }
            var games = _user.games;
            return res.json(games);
        });
    }
};

exports.deleteAll = function(req, res, next) {
    var user = req.user;
    var gameIds = user.games;

    if (user.admin){
        gameIds = {};
    }

    // TODO: remove games from users in middleware post remove;
    Game.find(gameIds)
        .then(function(games) {
            // Calling Game.remove(games) was not executing middleware hook
            console.log("Deleting games: " + JSON.stringify(games));
            var removedGames = [];
            for (var i = 0; i < games.length; i++) {
                var game = games[i];
                game.remove();
                removedGames.push(game.gameName);
            }
        return removedGames;
    }).then(function(removedGames){
        console.log("Deleted games: \n", JSON.stringify(removedGames));
        return res.send("Deleted games: \n", JSON.stringify(removedGames));
    }).catch(function(err){
        console.log(err, "Error deleting games");
        res.status(500).send(err);
    });

    //user.saveAsync()
    //    .then(function(user) {
    //        return Game.removeAsync({})
    //    }).then(function (games, err) {
    //        if (err) {
    //            res.status(500).send(err);
    //        } else {
    //            res.status(200).send("Deleted games for user: " + user.username);
    //        }
    //    });
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

exports.acceptInvite = function(req, res, next) {
    console.log("accepting invite");
    var user = req.user;
    var game = req.game;
    var userGames = user.games;
    var userInvites = user.invitations;

    if (!user)
        return res.status(500).send("Unable to read user.");
    if (!game)
        return res.status(500).send("Unable to read game.");

    // move game from users.invitations to user.games
    for (var i = 0; i < userInvites.length; i++) {
        if (userInvites[i].toString() == game._id.toString()){
            console.log("moving game to user.games from user.invitations");
            user.invitations.splice(i, 1);
            user.games.push(game._id);
        }
    }

    // mark player as joined, add to game.playersJoined
    var ndx = game.playersJoined.indexOf(user.userdigest);
    if (ndx > -1) {
        console.log("Adding user %s to playersJoined list.", user.username);
        game.playersJoined.push(user.userDigest);
    }

    game.saveAsync()
        .then(function(_game) {
            console.log("saved game");
            game = _game[0];

            return user.saveAsync();
        }).then(function(_user){
            console.log("saved user");

            res.json(game);
        }).catch(function(err){
            res.status(500).send("Error marking game as active." + err);
        });
};

// Non-exported functions