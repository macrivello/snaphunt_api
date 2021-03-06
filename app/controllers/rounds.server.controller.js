var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    Game = require('mongoose').model('Game'),
    Round = require('mongoose').model('Round'),
    Photo = require('mongoose').model('Photo'),
    User = require('mongoose').model('User'),
    events = require('events'),
    Events = require('../events/events.server'),
    eventEmitter = new events.EventEmitter();

exports.getRound = function (req, res, next, roundId){
    console.log("get round. id: " + roundId);
    console.log("path: " + req.path);
    // req.game should be populated
    if (!roundId) {
        console.log("Unable to find round. Invalid id.");
        return res.status(500).send("Unable to find round. Invalid id.");
    }

    // TODO: make sure round is in req.game

    // req.game should be valid since there is on a /game/:gameId route
    Round.findByIdAsync(roundId)
        .then(function(round){
            console.log("adding round to request object");
            req.round = round;
            next();
        }).catch(function(err){
            return res.status(500).send("Error finding round by ID");
        });
};

exports.listRounds = function(req, res, next){
    console.log("rounds list");
    var game = req.game;
    if (!game) {
        console.log("Unable to find round. Invalid id.");
        res.status(500).send("Unable to find round. Invalid id.");
        return next();
    }

    Round.populateAsync(game, { path: 'rounds'})
        .then(function(_game){
            return res.json(_game.rounds);
        }).catch(function(err){
            console.log("Error populating rounds");
            next(err);
        });
};

exports.readRound = function(req, res, next){
    //req.user, req.game, req.round
    console.log("round read");
    var round = req.round;
    if (!round)
        return res.status(500).send("Unable to read round.");

    // TODO: Validation?

    return res.json(round);
};



exports.updateRound = function(req, res, next) {

};

exports.deleteAll = function(req, res, next) {
    var user = req.user;
    var roundIds = req.game != null ? req.game.rounds : [];

    if (user.admin){
        roundIds = {};
    }

    // TODO: remove games from users in middleware post remove;
    Round.find(roundIds)
        .then(function(rounds) {
            console.log("Deleting rounds: " + JSON.stringify(roundIds));
            return Round.remove(rounds);
        }).then(function(removedRounds){
            console.log("Deleted %d rounds", removedRounds.length);
            return res.json(removedRounds);
        }).catch(function(err){
            console.log(err, "Error deleting rounds");
            res.status(500).send(err);
        });
};