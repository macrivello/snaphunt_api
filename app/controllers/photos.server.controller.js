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
    states = require('../models/states.server.enum'),
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
    photo.owner = user.userDigest;
    photo.theme = round.selectedTheme;

    photo.saveAsync()
        .then(function(_photo){
            console.log("Saved submitted photo: " + JSON.stringify(_photo[0]));
            console.log("Adding photo to rounds.photo. UD: " + user.userDigest);
            round.photos.push(_photo[0]._id);

            // Check if this is the final photo to be submitted for the round.
            console.log("photos: "+ round.photos.length);
            console.log("players: " + (game.players.length - 1));
            if (round.photos.length == game.players.length - 1) {
                console.log("Updating round state to " + states.roundStates.JUDGE_SELECTION);
                round.allPhotosSubmitted = true;
                round.state = states.roundStates.JUDGE_SELECTION;
            }

            return round.saveAsync();
        }).then(function(round) {
            console.log("Saved round with new photo");

            // TODO: Hook into Round and Game state changes in middleware to fire off events/notifications.

            //if (round.allPhotosSubmitted) {
            //    eventEmitter.emit(Events.allPhotosSubmitted, photo, round);
            //} else {
            //    eventEmitter.emit(Events.photoSubmitted, photo, round);
            //}

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
    console.log("read photo");
    var photo = req.photo;
    if (!photo) {
        console.log("Unable to find photo.");
        res.status(500).send("Unable to find photo.");
    }

    res.json(photo);
};

exports.selectWinner = function (req, res, next) {
    console.log("select winner");
    var photo = req.photo;    // This should be populated by getPhoto()
    var user = req.user;
    var game = req.game;
    var round = req.round;

    // TODO: more informative error?
    if (!round || !user || !game || !photo) {
        return res.status(500).send("Error processing request.")
    }

    console.log("updating round with winning photo");
    round.winningPhoto = photo._id;
    round.winner = user.userDigest;
    round.state = states.roundStates.ENDED;

    round.saveAsync()
        .then(function(_round){
            console.log("Updated round");
            return res.send("Selected winning photo.");
        }).catch(function(err){
            console.log("Error updating round");
            return res.status(500).send("Error selecting winning photo. " + err);
        });


};


exports.getPhotoFromUserDigestId = function (req, res, next) {
    console.log("getPhotoFromUserDigestId");
    var user = req.user;
    var game = req.game;
    var round = req.round;

    // TODO: pass through url path
    var userDigestId = req.query.udid;

    // TODO: Make more specific.
    if (!user || !game || !round) {
        return res.status(500).send("Unable to read photo.");
    }

    console.log("Looking up submitted photo of: " + userDigestId);
    Photo.find(round.photos)
        .then(function(photos){
            //console.log("looking through photos: " + photos);
            for (var i = 0; i < photos.length; i++) {
                var photo = photos[i];
                if (photo.owner == userDigestId){
                    console.log("Found round photo submitted by UD: " + userDigestId);
                    return res.json(photo);
                }
            }
            return res.status(401).send("No round photo found for userdigest " + userDigestId);
        }).catch(function (err) {
            console.log("Error finding photo by userdigest " + userDigestId + ". " + err);
             return res.status(500).send("Error finding photo by userdigest " + userDigestId + ". " + err);
        });
};

