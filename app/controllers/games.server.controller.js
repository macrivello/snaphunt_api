var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    Game = require('mongoose').model('Game'),
    Round = require('mongoose').model('Round'),
    Photo = require('mongoose').model('Photo'),
    User = require('mongoose').model('User'),
    Theme = require('mongoose').model('Theme'),
    event = require('events'),
    Events = require('../events/events.server'),
    eventEmitter = new event.EventEmitter();

eventEmitter.on(Events.gameCreated, onNewGameCreated);

function onNewGameCreated (game) {
    console.log("onNewGameCreated");
}

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
    Theme.findRandom({}, {}, { limit: 3  }).exec()
        .then(function(themes){
            // create Theme array to add to Rounds
            console.log("Themes.findRandom returned: " + JSON.stringify(themes));
            var themeIds = [];
            for (i = 0; i < themes.length; i++){
                themeIds.push = themes[i]._id;
            }

            // Create rounds for game.
            // TODO : a cleaner solution please...
            var r = [];
            for (i = 0; i < game.numberOfRounds; i++){
                r.push = { themes: themeIds};
            }

            return Round.create(r)
        }).then(function(roundsReturned) {
            console.log("Round.created() returned: " + JSON.stringify(roundsReturned));

            var numRounds = roundsReturned.length;
            if (numRounds != game.numberOfRounds) {
                console.log("Error creating %d rounds. Only created %d " + err, game.numberOfRounds, numRounds);
                return res.status(500).send("Error creating new game. " + err);
            }

            var rounds = roundsReturned;
            for (i = 0; i < numRounds; i++) {
                game.rounds[i] = rounds[i]._id;
            }

            return game.saveAsync();
        }).spread(function(gameSaved, numCreated){
            console.log("New Game created.");
            eventEmitter.emit(Events.gameCreated, gameSaved);

            user.games.push(gameSaved._id);
            game = gameSaved;

            return user.saveAsync();
        }).spread(function(user){
            console.log("Updated %s with new game.", user.username);

            return res.json(game);
        }).catch(function(err){
            console.log("Error creating new game. " + err);

            return res.status(500).send("Error creating new game. " + err);
        });
};

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
            return next();
        }).catch(function(err){
            res.status(500).send("Error finding game by ID");
            return next();
        });

};

exports.read = function(req, res, next){
    if (!req.game)
        return res.status(500).send("Unable to read game.");

    return res.json(req.game);
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

exports.delete = function(req, res, next){
    var game = req.game;
    var user = req.user;

    if (!game)
        return res.status(500).send("Unable to read game.");

    game.removeAsync()
        .then(function(err){
            console.log("Successfully updated game.");
            return res.json(game);
        }).catch(function(err){
            return res.status(500).send("Error updating game. " + err);
        });
};

exports.list = function(req, res, next){
    var user = req.user;
    if (!user)
        return res.status(500).send("Unable to read user.");

    Game.populateAsync(user, { path: 'games'})
        .then(function(games){
            return res.json(games)
        }).catch(function(err){
            console.log("Error populating games");
            return res.status(500).send("Unable populating games for %s.", user.username);
        });
};
