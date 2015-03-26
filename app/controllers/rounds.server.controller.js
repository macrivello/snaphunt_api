var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    Game = require('mongoose').model('Game'),
    Round = require('mongoose').model('Round'),
    Photo = require('mongoose').model('Photo'),
    User = require('mongoose').model('User'),
    events = require('events'),
    eventEmitter = new events.EventEmitter();


exports.getRound = function (req, res, next, roundId){
    // req.game should be populated
    if (!roundId) {
        console.log("Unable to find round. Invalid id.");
        return res.status(500).send("Unable to find round. Invalid id.");
    }

    // TODO: make sure round is in req.game
    // req.game should be valid since there is on a /game/:gameId route
    Round.findByIdAsync(roundId)
        .then(function(round){
            req.round = round;
            return next();
        }).catch(function(err){
            return res.status(500).send("Error finding round by ID");
        });
};

exports.list = function(req, res, next){
    var game = req.game;
    if (!game) {
        console.log("Unable to find round. Invalid id.");
        res.status(500).send("Unable to find round. Invalid id.");
        return next();
    }

    Round.populateAsync(game, { path: 'rounds'})
        .then(function(rounds){
            console.log(JSON.stringify(rounds));
            return res.json(rounds)
        }).catch(function(err){
            console.log("Error populating rounds");
        });
};

exports.read = function(req, res, next, roundId){
    //req.user, req.game, req.round
    if (!roundId)
        return res.status(500).send("Unable to read game.");

    Round.findByIdAsync(roundId)
        .then(function(round){
            return res.json(round);
        }).catch(function(err){
            return res.status(500).send("Unable to read game.");
        })
};