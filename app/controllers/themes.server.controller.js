var Promise = require('bluebird');

var mongoose = Promise.promisifyAll(require('mongoose')),
    Game = require('mongoose').model('Game'),
    Round = require('mongoose').model('Round'),
    Photo = require('mongoose').model('Photo'),
    User = require('mongoose').model('User'),
    Theme = require('mongoose').model('Theme'),
    events = require('events'),
    eventEmitter = new events.EventEmitter();

exports.list = function(req, res, next) {
    console.log('Listing themes');
    Theme.find({}, function(err, themes) {
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



