var Promise = require('bluebird');


var mongoose = Promise.promisifyAll(require('mongoose')),
    event = require('events'),
    eventEmitter = new event.EventEmitter(),
    Events = require('../events/events.server'),
    User = require('mongoose').model('User'),
    Game = require('mongoose').model('Game'),
    Round = require('mongoose').model('Round'),
    Photo = require('mongoose').model('Photo'),
    util = require('../util/util.js'),
    gcm = require('./gcm.server.controller.js');


exports.submitPhoto = function (req, res, next) {
    console.log("submit photo. body: " + JSON.stringify(req.body));
    var user = req.user;
    var game = req.game;
    var round = req.round;

    if (!req.body || util.isEmpty(req.body))
        return res.status(500).send("Invalid request body.");

    // TODO: more informative error?
    if (!round || !user || !game){
        return res.status(500).send("Error processing request.")
    }

    var photo = new Photo(req.body);
    photo.owner = user._id;
    photo.theme = round.selectedTheme;

    photo.saveAsync()
        .then(function(photo){
            // Storing photos as key-value with key as userDigestId.
            //   This is used for grabbing round photos from userdigest.
            round.photos[user.userDigest] = photo;

            // Check if this is the final photo to be submitted for the round.
            if (Object.keys(round.photos).length == game.players.length - 1) {
                round.allPhotosSubmitted = true;
            }

            return round.saveAsync();
        }).then(function(round) {
            if (round.allPhotosSubmitted) {
                eventEmitter.emit(Events.allPhotosSubmitted, photo, round);
            } else {
                eventEmitter.emit(Events.photoSubmitted, photo, round);
            }

            res.json(photo);
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

exports.selectWinner = function (req, res, next) {
    console.log("select winner");
    var photo = req.photo;    // This should be populated by getPhoto()

    if (!photo)
        return res.status(500).send("Unable to read photo.");

    return res.send("NOT IMPLEMENTED YET")
};


exports.getPhotoFromUserDigestId = function (req, res, next, userDigestId) {
    var user = req.user;
    var game = req.game;
    var round = req.round;

    // TODO: Make more specific.
    if (!user || !game || !round) {
        return res.status(500).send("Unable to read photo.");
    }

    console.log("Looking up submitted photo of: " + photoId);
    var photoId = game.photo[userDigestId];

    console.log("Looking up photoId: " + photoId);
    Photo.findById(photoId)
        .then(function(photo) {
            res.json(photo);
        }).catch(function(err){
            return res.status(500).send("Error finding photo with ID: " + photoId);
        })
};

