var Promise = require('bluebird');


var mongoose = Promise.promisifyAll(require('mongoose')),
    event = require('events'),
    eventEmitter = new event.EventEmitter(),
    Events = require('../events/events.server'),
    User = require('mongoose').model('User'),
    Game = require('mongoose').model('Game'),
    Round = require('mongoose').model('Round'),
    gcm = require('./gcm.server.controller.js');


exports.submitPhoto = function (req, res, next) {
    var user = req.user;
    var game = req.game;
    var round = req.round;

    if (!req.body)
        return res.status(500).send("Invalid request body.");

    // TODO: more informative error?
    if (!round || !user || !game){
        return res.status(500).send("Error processing request.")
    }

    var photo = new Photo(req.body);
    photo.owner = user._id;

    photo.saveAsync()
        .then(function(photo){
            // TODO: Would love to store photos as a map, ie round.photos[user._id] = photo;
            round.photos.push = photo;

            // Check if this is the final photo to be submitted for the round.
            if (round.photos.length == game.players.length - 1) {
                round.allPhotosSubmitted = true;
            }

            return round.saveAsync();
        }).then(function(round) {
            if (round.allPhotosSubmitted)
                eventEmitter.emit(Events.allPhotosSubmitted, photo, round);
            elses
                eventEmitter.emit(Events.photoSubmitted, photo, round);

            return next();
        }).catch(function(err){
            return res.status(500).send("Error saving photo. " + err);
        });
};

exports.getPhoto = function (req, res, next, photoId) {
    console.log("get photo");
    if (!photoId) {
        console.log("Unable to find photo. Invalid id.");
        res.status(401).send("Unable to find photo. Invalid id.");
    }

    Photo.findById(photoId)
        .then(function(photo) {
            req.photo = photo;
            next();
        }).catch(function(err){
            return res.status(500).send("Error finding photo with ID: " + photoId);
        })
};

exports.readPhoto = function (req, res, next) {

    var photo = req.photo;    // This should be populated by getPhoto()

    if (!photo)
        return res.status(500).send("Unable to read photo.");

    res.json(photo);
};