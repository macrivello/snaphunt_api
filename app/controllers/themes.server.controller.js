var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    GameStates = require('../models/game.server.model'),
    RoundStates = require('../models/round.server.model');
    Game = require('mongoose').model('Game'),
    Round = require('mongoose').model('Round'),
    Photo = require('mongoose').model('Photo'),
    User = require('mongoose').model('User'),
    Theme = require('mongoose').model('Theme'),
    events = require('events'),
    Events = require('../events/events.server'),
    eventEmitter = new events.EventEmitter();

exports.list = function(req, res, next) {
    console.log('Listing themes for round.');
    console.log(JSON.stringify(req.round));

    var lookup;

    if (!req.round.themes || req.round.themes.length == 0) {
        console.log("no themes");
        lookup = {};
    } else {
        lookup = { '_id': { $in: req.round.themes}};
    }

    Theme.find(lookup, function(err, themes) {
        if (err) {
            return next(err);
        }
        else {
            res.json(themes);
        }
    });
};

exports.delete = function(req, res, next) {
    Theme.remove({}, function (err) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send("Deleted themes");
        }
    });
};

exports.like = function(req, res, next) {

};

exports.dislike = function(req, res, next) {

};

exports.neutral = function(req, res, next) {

};

exports.getTheme = function(req, res, next, themeId) {
    if (!themeId)
        return res.status(500).send("Invalid theme ID.");

    Theme.findByIdAsync(themeId)
        .then(function(theme){
            req.theme = theme;
            return next();
        }).catch(function(err){
            return res.status(500).send("Unable to read theme. " + err);
        })};

exports.selectTheme  = function(req, res, next) {
    // Populated from getRound call
    var user = req.user;
    var game = req.game;
    var round = req.round;
    var theme = req.theme;

    if (!round || !user) {
        return res.status(500).send("Unable to read round.");
    }

    console.log("Select Theme: " + JSON.stringify(theme));

    // TODO: add verification on themeId
    if (round.judge.toString() != user.userDigest.toString()) {
        console.log("User selecting theme for round is not judge. judge: '%s' user: '%s'",
            round.judge, user._id);

        return res.status(401).send("User selecting theme for round is not judge");
    }

    round.selectedTheme = theme._id;
    round.active = true;

    if(!game.gameStarted){
        game.gameStarted = true;
        game.save();
    }

    round.saveAsync().then(function (_round) {
        console.log("Round Active. Set round: '%s' to selectedTheme: '%s'", round._id, theme._id);
        return res.send("Round " + round.roundNumber + " theme: " + theme.phrase);
    }).catch(function(err){
        return res.status(500).send("Unable to set selected theme for round.", err);
    });

    //TODO: fire event that round has been started.
    process.emit(Events.themeSelected, {"userDigestIdOfCreator" : user.userdigest, "game" : game} );
};

exports.readTheme = function(req, res, next) {
    var theme = req.theme;
    if (!theme) {
        res.status(500).send("Error reading Theme");
    }

    res.json(theme);
};

