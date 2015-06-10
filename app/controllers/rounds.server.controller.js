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

exports.readRound = function(req, res, next, roundId){
    //req.user, req.game, req.round
    console.log("round read");
    var round = req.round;
    if (!round)
        return res.status(500).send("Unable to read round.");

    // TODO: Validation?

    return res.json(round);
};

exports.selectTheme  = function(req, res, next, themeId) {
    // Populated from getRound call
    var user = req.user;
    var round = req.round;
    if (!round || !user) {
        return res.status(500).send("Unable to read round.");
    }

    // TODO: add verification on themeId
    if (round.judge != user._id) {
        console.log("User selecting theme for round is not judge. judge: '%s' user: '%s'",
            round.judge, user._id);

        return res.status(401).send("User selecting theme for round is not judge. judge: '%s' user: '%s'",
            round.judge, user._id);
    }

    round.selectedTheme = themeId;
    round.active = true;
    round.saveAsync().then(function (_round) {
        console.log("Round Active. Set round: '%s' to selectedTheme: '%s'", round._id, themeId);
    }).catch(function(err){
        return res.status(500).send("Unable to set selected theme for round.", err);
    });

    //TODO: fire event that round has been started.
    //process.emit(Events.themeSelected, );

    next();

};